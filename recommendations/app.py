import eventlet
eventlet.monkey_patch(os=False)

import json
import os
import uuid
from threading import Lock

import spotipy
from flask import Flask, redirect, render_template, request, session
from flask_session import Session
from flask_socketio import SocketIO
from numpy import dot
from numpy.linalg import norm
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth

import config

app = Flask(__name__)
os.environ['SPOTIPY_CLIENT_ID'] = config.spotipy_client_id
os.environ['SPOTIPY_CLIENT_SECRET'] = config.spotipy_client_secret
os.environ['SPOTIPY_REDIRECT_URI'] = config.spotipy_redirect_uri
app.config['SECRET_KEY'] = config.spotipy_client_id
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './.flask_session/'
Session(app)

ASYNC_MODE = None

socketio = SocketIO(app,
                    async_mode=ASYNC_MODE,
                    manage_session=False,
                    logger=True,
                    engineio_logger=True)
THREAD = None
thread_lock = Lock()


SCOPE = "user-library-read"
# OAuth Init
soa = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=SCOPE))

# Client Credentials Init
client_credentials_manager = SpotifyClientCredentials()
scc = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
scc.trace = True

CACHES_FOLDER = './.spotify_caches/'
if not os.path.exists(CACHES_FOLDER):
    os.makedirs(CACHES_FOLDER)

WORKER_OBJECT = None


class Worker(object):
    '''
    Used to make a thread that can be interrupted during operation
    '''

    switch = False

    def __init__(self, playlist_id, amount, playlist):
        self.socketio = socketio

        self.playlist_id = playlist_id
        self.amount = amount
        self.playlist = playlist
        self.uuid = session.get('uuid')

        # scan_playlist instances
        self.retrieved_songs = None
        self.retrieved_artists = None
        self.retrieved_genres = None
        self.song_error_count = None
        self.tracks = None
        self.genres = None
        self.average_features = None

        # artist_genres instances
        self.artist_scan_count = None

        # recommendations instances
        self.get_recommendations_counter = None
        self.analyse_recommendations_counter = None
        self.similarity_recommendations_counter = None
        self.song_recommendations = None

        self.skip1 = False  # Skip scanning songs
        self.skip2 = False  # Skip getting recommendations
        self.switch = True  # Stop task

    def session_cache_path(self):
        '''
        Returns the directory of the users cached token
        '''

        return CACHES_FOLDER + self.uuid

    def cache_auth(self):
        '''
        Spotipy authentication flow to authenticate requests
        '''

        cache_handler = spotipy.cache_handler.CacheFileHandler(
            cache_path=self.session_cache_path())
        auth_manager = spotipy.oauth2.SpotifyOAuth(scope='''user-library-read
                                                        playlist-read-private
                                                        playlist-modify-public
                                                        playlist-modify-private''',
                                                    cache_handler=cache_handler,
                                                    show_dialog=True)
        return cache_handler, auth_manager

    def scan_playlist(self):
        '''
        Retrieves songs from selected playlist
        '''

        auth_manager = self.cache_auth()[1]
        sam = spotipy.Spotify(auth_manager=auth_manager)

        self.retrieved_songs = 0
        self.retrieved_artists = 0
        self.retrieved_genres = 0
        self.song_error_count = 0

        # Get songs from playlist
        if self.playlist_id == 'liked songs':
            self.socketio.emit('retrieving_songs',
                                {'data': self.playlist[-1]},
                                namespace=f'/{self.uuid}_{self.playlist_id}')
            results = sam.current_user_saved_tracks(limit=50)
            tracks, artists, average_features = self.append_songs(
                [], [], results, None)
        else:
            self.socketio.emit('retrieving_songs',
                                {'data': self.playlist[-1]},
                                namespace=f'/{self.uuid}_{self.playlist_id}')
            results = sam.playlist_tracks(self.playlist_id, limit=50)
            tracks, artists, average_features = self.append_songs(
                [], [], results, None)

        while results['next'] and self.switch is True and self.skip1 is False:
            results = sam.next(results)
            tracks, artists, average_features = self.append_songs(tracks,
                                                                    artists,
                                                                    results,
                                                                    average_features)

        # Average average feature values
        if self.switch is True:
            for i in average_features:
                average_features[i] = round(
                    average_features[i] / (len(tracks) - self.song_error_count), 5)

        # Get genres of artists
        if self.switch is True:
            self.socketio.emit('retrieving_genres',
                                namespace=f'/{self.uuid}_{self.playlist_id}')
            genres = self.artist_genres(artists)

            self.tracks = tracks
            self.genres = genres
            self.average_features = average_features

        if self.switch is True:
            self.recommendations()

        if self.switch is True:
            self.socketio.emit('store_data', {
                'tracks': self.tracks,
                'artists': artists,
                'genres': self.genres,
                'song_error_count': self.song_error_count,
                'recommendations': self.song_recommendations,
                'playlist': self.playlist,
                'average_features': self.average_features
            }, namespace=f'/{self.uuid}_{self.playlist_id}')

    def append_songs(self, tracks, artists, results, average_features):
        '''
        Retrieves artists from tracks and track features
        '''

        for i in results['items']:
            if self.skip1 is True:
                return tracks, artists, average_features
            track_id = i['track']['id']
            tracks.append(track_id)
            average_features = self.collate_features(
                track_id, average_features)

            for j in i['track']['artists']:
                if j['id'] not in artists and self.switch is True:
                    artists.append(j['id'])

                    self.retrieved_artists += 1
                    self.socketio.emit('retrieved_artists',
                                        {'data': self.retrieved_artists},
                                        namespace=f'/{self.uuid}_{self.playlist_id}')

        return tracks, artists, average_features

    def artist_genres(self, artists):
        '''
        Retrieves genres from artists
        '''

        genres_lst = []
        genres = {}
        self.artist_scan_count = 0

        # Get genres of each artist
        for i in artists:
            if self.switch is True:
                self.artist_scan_count += 1
                self.socketio.emit('retrieved_genres',
                                {'data': self.retrieved_genres,
                                    'artist_count': self.artist_scan_count},
                                namespace=f'/{self.uuid}_{self.playlist_id}')
                results = scc.artist(i)

                if 'genres' in results:
                    for j in results['genres']:
                        if j not in genres_lst and self.switch is True:
                            genres_lst.append(j)
                        elif self.switch is True:
                            if j not in genres:
                                genres[j] = 2

                                self.retrieved_genres += 1
                                self.socketio.emit('retrieved_genres',
                                                    {'data': self.retrieved_genres,
                                                        'artist_count': self.artist_scan_count},
                                                    namespace=f'/{self.uuid}_{self.playlist_id}')
                            else:
                                genres[j] += 1

        # Order genres by value
        if self.retrieved_genres != 0:
            genres = dict(
                sorted(genres.items(), key=lambda item: item[1], reverse=True))

            # Put all keys of genres into a list
            new_genres_lst = []
            for i in genres.keys():
                new_genres_lst.append(i)

            return new_genres_lst
        else:
            return genres_lst

    def collate_features(self, track_id, average_features):
        '''
        Retrieves features of tracks
        '''

        if average_features is None:
            average_features = {
                "acousticness": 0,
                "danceability": 0,
                "energy": 0,
                "instrumentalness": 0,
                "liveness": 0,
                "loudness": 0,
                "speechiness": 0,
                "tempo": 0,
                "valence": 0
            }

        if self.switch is True:
            features = scc.audio_features(track_id)

            if isinstance(features[0], dict):
                average_features['acousticness'] += features[0]['acousticness']
                average_features['danceability'] += features[0]['danceability']
                average_features['energy'] += features[0]['energy']
                average_features['instrumentalness'] += features[0]['instrumentalness']
                average_features['liveness'] += features[0]['liveness']
                average_features['loudness'] += features[0]['loudness']
                average_features['speechiness'] += features[0]['speechiness']
                average_features['tempo'] += features[0]['tempo']
                average_features['valence'] += features[0]['valence']
            else:
                self.song_error_count += 1
                self.socketio.emit('failed_scans',
                                    {'data': self.song_error_count},
                                    namespace=f'/{self.uuid}_{self.playlist_id}')

        if self.switch is True:
            self.retrieved_songs += 1
            self.socketio.emit('retrieved_songs',
                                {'data': self.retrieved_songs},
                                namespace=f'/{self.uuid}_{self.playlist_id}')

        return average_features

    def recommendations(self):
        '''
        Collects and sorts recommendations
        '''

        tracks = self.tracks
        genres = self.genres
        average_features = self.average_features

        self.get_recommendations_counter = 0
        self.analyse_recommendations_counter = 0
        self.similarity_recommendations_counter = 0

        if self.switch is True:
            self.socketio.emit('getting_recommendations',
                                namespace=f'/{self.uuid}_{self.playlist_id}')
            recommendations = self.get_recommendations(tracks, genres)

        if self.switch is True:
            self.socketio.emit('analysing_recommendations',
                                namespace=f'/{self.uuid}_{self.playlist_id}')
            recommendations = self.recommendations_features(recommendations)

        if self.switch is True:
            self.socketio.emit('scoring_recommendations',
                                namespace=f'/{self.uuid}_{self.playlist_id}')
            recommendations = self.recommendations_similarity(
                recommendations, average_features)
            self.song_recommendations = recommendations

    def get_recommendations(self, tracks, genres):
        '''
        Gets recommendations based on playlist
        '''

        recommendations = []

        while len(recommendations) < self.amount and self.switch is True and self.skip2 is False:
            for i in tracks:
                if len(recommendations) == self.amount or self.skip2 is True:
                    return recommendations

                results = scc.recommendations(seed_tracks=[i], limit=1)
                recommendation = results['tracks']

                if recommendation:
                    recommendations = self.check_recommendation(
                        recommendation, tracks, genres, recommendations)
        return recommendations

    def check_recommendation(self, recommendation, tracks, genres, recommendations):
        '''
        Checks recommendation, ensuring its not redundant or a duplicate
        '''

        track = recommendation[0]
        track_id = track['id']

        if track_id not in tracks and not any(d['id'] == track_id for d in recommendations):
            # Check if user has skipped recommendations
            if self.skip2 is True:
                return recommendations

            # Loop through artists to get genres of recommended song
            recommended_artists = []
            recommended_genres = []
            for j in track['artists']:
                # Add artist to recommended artists
                recommended_artists.append({
                    'id': j['id'],
                    'name': j['name']
                })

                recommended_artist = scc.artist(j['id'])
                artist_genres = recommended_artist['genres']

                # Loop through genres, adding unique ones to recommended_genres
                for k in artist_genres:
                    if k not in recommended_genres:
                        recommended_genres.append(k)

            # Check if any recommended genres are relevant to the playlist
            if (set(recommended_genres) & set(genres) and
                    self.switch is True and self.skip2 is False):
                recommendations.append({
                    'id': track_id,
                    'explicit': track['explicit'],
                    'name': track['name'],
                    'artists': recommended_artists,
                    'preview': track['preview_url']
                })

                self.get_recommendations_counter += 1
                self.socketio.emit('get_recommendations',
                                    {'data': self.get_recommendations_counter},
                                    namespace=f'/{self.uuid}_{self.playlist_id}')

        return recommendations


    def recommendations_features(self, recommendations):
        '''
        Gets features of recommended tracks
        '''

        for i in recommendations:
            if self.switch is True:
                features = scc.audio_features(i['id'])

                if isinstance(features[0], dict):
                    i['features'] = {
                        'acousticness': features[0]['acousticness'],
                        'danceability': features[0]['danceability'],
                        'energy': features[0]['energy'],
                        'instrumentalness': features[0]['instrumentalness'],
                        'liveness': features[0]['liveness'],
                        'loudness': features[0]['loudness'],
                        'speechiness': features[0]['speechiness'],
                        'tempo': features[0]['tempo'],
                        'valence': features[0]['valence']
                    }
                else:
                    recommendations.pop(i)

            if self.switch is True:
                self.analyse_recommendations_counter += 1
                self.socketio.emit('analyse_recommendations',
                                    {'data': self.analyse_recommendations_counter},
                                    namespace=f'/{self.uuid}_{self.playlist_id}')

        return recommendations

    def recommendations_similarity(self, recommendations, average_features):
        '''
        Scores recommended tracks against playlist
        '''

        # Append average feature values to a list
        average_values = []
        for val in average_features.values():
            if self.switch is True:
                average_values.append(val)

        # Iterate through tracks
        for i in recommendations:
            if self.switch is True:
                features = i['features']
                # Append track feature values to a list
                feature_values = []
                for val in features.values():
                    feature_values.append(val)

                cos_similarity = dot(
                    average_values, feature_values) / (norm(average_values) * norm(feature_values))
                i['similarity'] = cos_similarity

                self.similarity_recommendations_counter += 1
                self.socketio.emit('similarity_recommendations',
                                    {'data': self.similarity_recommendations_counter},
                                    namespace=f'/{self.uuid}_{self.playlist_id}')

        if self.switch is True:
            self.socketio.emit('sorting_recommendations',
                                namespace=f'/{self.uuid}_{self.playlist_id}')
            return sorted(recommendations, key=lambda d: d['similarity'], reverse=True)

        return recommendations

    def skip_songs(self):
        '''
        Interrupts thread to skip song scanning
        '''

        self.skip1 = True

    def skip_recommendations(self):
        '''
        Interrupts thread to skip recommendation retrieval
        '''

        self.skip2 = True

    def stop(self):
        '''
        Interrupts and stops thread
        '''

        self.switch = False


# --------------------------- Functions -----------------------------------

def session_cache_path():
    '''
    Returns the directory of the users cached token
    '''

    return CACHES_FOLDER + session.get('uuid')


def cache_auth():
    '''
    Spotipy authentication flow to authenticate requests
    '''

    cache_handler = spotipy.cache_handler.CacheFileHandler(
        cache_path=session_cache_path())
    auth_manager = spotipy.oauth2.SpotifyOAuth(scope='''user-library-read
                                                    playlist-read-private
                                                    playlist-modify-public
                                                    playlist-modify-private''',
                                                cache_handler=cache_handler,
                                                show_dialog=True)
    return cache_handler, auth_manager


# --------------------------- Routes -----------------------------------
@app.route('/')
def index():
    '''
    Directs user between login, home and thread exists pages
    '''

    if not session.get('uuid'):
        session['uuid'] = str(uuid.uuid4())

    cache_handler, auth_manager = cache_auth()

    if request.args.get("code"):
        auth_manager.get_access_token(request.args.get("code"))
        return redirect('/')

    if not auth_manager.validate_token(cache_handler.get_cached_token()):
        return render_template('index.html')

    if 'thread' in session:
        return render_template('thread_exists.html')

    sam = spotipy.Spotify(auth_manager=auth_manager)

    results = sam.current_user_saved_tracks(limit=1)
    liked_total = results['total']

    results = sam.current_user_playlists()
    playlists = []
    for i in results['items']:
        if i['tracks']['total'] > 0:
            playlists.append({
                'images': i['images'],
                'name': i['name'],
                'tracks': i['tracks'],
                'id': i['id']
            })

    session['scan_count'] = 0
    return render_template('home.html', liked_total=liked_total, playlists=playlists)


@app.route('/login')
def login():
    '''
    Logs user in, creating a session
    '''

    auth_manager = cache_auth()[1]
    return redirect(auth_manager.get_authorize_url())


@app.route('/signout')
def signout():
    '''
    Signs user out, clearing their session
    '''

    try:
        os.remove(session_cache_path())
        session.clear()
    except OSError as err:
        print(f"Error: {err.filename} - {err.strerror}.")
    return redirect('/')


@app.route('/scan', methods=['GET', 'POST'])
def scan():
    '''
    Directs user to scan page
    '''

    cache_handler, auth_manager = cache_auth()
    # Check is user has a valid token
    if not auth_manager.validate_token(cache_handler.get_cached_token()):
        return redirect('/')

    if 'thread' in session:
        return redirect('/')

    if request.method == 'POST':
        amount = request.form['amount']
        playlist_id = request.form['scan_btn']

        sam = spotipy.Spotify(auth_manager=auth_manager)
        if playlist_id == 'liked songs':
            # Get liked details
            results = sam.current_user_saved_tracks(limit=1)
            playlist = ['liked songs',
                        '../static/images/liked_songs_cover.png',
                        'Liked Songs',
                        results['total']]
        else:
            # Get playlist details
            results = sam.playlist(playlist_id)
            playlist = [playlist_id,
                        results['images'][0]['url'],
                        results['name'],
                        results['tracks']['total']]

        session['playlist'] = playlist
        return render_template('scan.html',
                                async_mode=socketio.async_mode,
                                id=playlist_id, uuid=session['uuid'],
                                amount=amount,
                                playlist=playlist)

    return redirect('/')


@app.route('/store_data', methods=['GET', 'POST'])
def store_data():
    '''
    Stores recommendations information in session
    '''

    namespace = request.form['namespace']
    tracks = json.loads(request.form['tracks'])
    artists = json.loads(request.form['artists'])
    genres = json.loads(request.form['genres'])
    song_error_count = request.form['song_error_count']
    recommendations = json.loads(request.form['recommendations'])
    playlist = json.loads(request.form['playlist'])
    average_features = json.loads(request.form['average_features'])

    session['tracks'] = tracks
    session['artists'] = artists
    session['genres'] = genres
    session['song_error_count'] = song_error_count
    session['recommendations'] = recommendations
    session['playlist'] = playlist
    session['average_features'] = average_features

    socketio.emit('redirect', namespace=namespace)
    return 'success'


@app.route('/recommend')
def recommend():
    '''
    Directs user to recommendations page
    '''

    results = [
        len(session['tracks']),
        len(session['artists']),
        len(session['genres']),
        session['song_error_count']
    ]

    return render_template('recommend.html',
                            recommendations=session['recommendations'],
                            playlist=session['playlist'],
                            results=results,
                            average_features=session['average_features'])


@app.route('/add_to_playlist', methods=['GET', 'POST'])
def add_to_playlist():
    '''
    Add selected songs from recommend page to a playlist
    '''

    if request.method == 'POST':
        auth_manager = cache_auth()[1]
        sam = spotipy.Spotify(auth_manager=auth_manager)

        playlist_id = request.form['playlist']
        name = request.form['playlist_name']
        tracks = json.loads(request.form['tracks'])
        uris = ["spotify:track:" + i for i in tracks]

        if request.form['playlist'] == 'new':
            user_id = sam.me()['id']
            new_playlist = sam.user_playlist_create(
                user_id, name=f'Recommendations based on {name}')
            playlist_id = new_playlist['id']

        # Add songs to playlist
        while uris:
            new_uris = uris[:100]
            sam.playlist_add_items(playlist_id, new_uris)
            uris = uris[100:]

        return 'success'

    return redirect('/')


@app.route('/close_thread', methods=['GET', 'POST'])
def close_thread():
    '''
    Interrupts thread to stop it
    '''

    if request.method == 'POST' and 'thread' in session:
        session.pop('thread')
        WORKER.stop()

        return 'success' if 'data' in request.form else redirect('/')
    return redirect('/')


@socketio.on('connect_event')
def connect_event(message):
    '''
    Initialises and starts thread
    '''

    playlist_id = message['data']
    amount = int(message['amount'])
    playlist = session['playlist']

    session['thread'] = True

    global WORKER
    WORKER = Worker(playlist_id, amount, playlist)

    socketio.start_background_task(target=WORKER.scan_playlist)


@socketio.on('skip_songs_event')
def skip_songs_event():
    '''
    Interrupts thread to skip song scanning
    '''

    WORKER.skip_songs()


@socketio.on('skip_recommendations_event')
def skip_recommendations_event():
    '''
    Interrupts thread to skip recommendations retrieval
    '''

    WORKER.skip_recommendations()


if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0")
