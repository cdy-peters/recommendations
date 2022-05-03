import eventlet
eventlet.monkey_patch(os=False)

import json, spotipy, os, config, uuid
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from flask import Flask, render_template, request, redirect, session
from flask_session import Session
from numpy import dot
from numpy.linalg import norm
from threading import Lock
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(64)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './.flask_session/'
Session(app)

async_mode = None

app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode, manage_session=False, logger=True, engineio_logger=True)
thread = None
thread_lock = Lock()

os.environ['SPOTIPY_CLIENT_ID']=config.spotipy_client_id
os.environ['SPOTIPY_CLIENT_SECRET']=config.spotipy_client_secret
os.environ['SPOTIPY_REDIRECT_URI']=config.spotipy_redirect_uri

scope = "user-library-read"
# OAuth Init
soa = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))

# Client Credentials Init
client_credentials_manager = SpotifyClientCredentials()
scc = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
scc.trace = True

caches_folder = './.spotify_caches/'
if not os.path.exists(caches_folder):
    os.makedirs(caches_folder)


workerObject = None

class Worker(object):

    switch = False

    def __init__(self, socketio, id, playlist, uuid):
        self.socketio = socketio

        self.id = id
        self.playlist = playlist
        self.uuid = uuid

        self.switch = True

    def session_cache_path(self):
        return caches_folder + self.uuid

    def cache_auth(self):
        cache_handler = spotipy.cache_handler.CacheFileHandler(cache_path=self.session_cache_path())
        auth_manager = spotipy.oauth2.SpotifyOAuth(scope='user-library-read playlist-read-private playlist-modify-public playlist-modify-private',
                                                    cache_handler=cache_handler, 
                                                    show_dialog=True)
        return cache_handler, auth_manager

    def scan_playlist(self):
        cache_handler, auth_manager = self.cache_auth()
        sp = spotipy.Spotify(auth_manager=auth_manager)

        self.retrieved_songs = 0
        self.retrieved_artists = 0
        self.retrieved_genres = 0
        self.song_error_counter = 0

        # Get songs from playlist
        if self.id == 'liked songs':
            self.socketio.emit('retrieving_songs', {'data': self.playlist[-1]})
            results = sp.current_user_saved_tracks(limit=20)
            tracks, artists = self.append_songs([], [], results)
            while results['next'] and self.switch == True:
                results = sp.next(results)
                tracks, artists = self.append_songs(tracks, artists, results)
        else:
            self.socketio.emit('retrieving_songs', {'data': self.playlist[-1]})
            results = sp.playlist_tracks(self.id)
            tracks, artists = self.append_songs([], [], results)
            while results['next'] and self.switch == True:
                results = sp.next(results)
                tracks, artists = self.append_songs(tracks, artists, results)

        # Get average feature values
        if self.switch == True:
            average_features, song_error_count = self.collate_features(tracks)
            for i in average_features:
                average_features[i] = round(average_features[i] / (len(tracks) - song_error_count), 5)
        
        # Get genres of artists
        if self.switch == True:
            self.socketio.emit('retrieving_genres')
            genres = self.artist_genres(artists)

            self.tracks = tracks
            self.artists = artists
            self.genres = genres
            self.average_features = average_features
            self.song_error_count = song_error_count

        if self.switch == True:
            self.recommendations()

        if self.switch == True:
            self.socketio.emit('store_data', {
                'tracks': self.tracks,
                'artists': self.artists,
                'genres': self.genres,
                'song_error_count': self.song_error_count,
                'recommendations': self.recommendations,
                'playlist': self.playlist,
                'average_features': self.average_features
            })


    def append_songs(self, tracks, artists, results):
        for i in results['items']:
            track_id = i['track']['id']
            tracks.append(track_id)

            for j in i['track']['artists']:
                if j['id'] not in artists and self.switch == True:
                    artists.append(j['id'])

                    self.retrieved_artists += 1
                    self.socketio.emit('retrieved_artists', {'data': self.retrieved_artists})

        return tracks, artists
    
    def artist_genres(self, artists):
        genres_lst = []
        genres = {}

        # Get genres of each artist
        for i in artists:
            if self.switch == True:
                results = scc.artist(i)

                for j in results['genres']: # TODO: Do something if no results are returned
                    if j not in genres_lst and self.switch == True:
                        genres_lst.append(j)
                    elif self.switch == True:
                        if j not in genres:
                            genres[j] = 2

                            self.retrieved_genres += 1
                            self.socketio.emit('retrieved_genres', {'data': self.retrieved_genres})
                        else:
                            genres[j] += 1

        # Order genres by value
        if self.retrieved_genres != 0:
            genres = dict(sorted(genres.items(), key=lambda item: item[1], reverse=True))
            
            # Put all keys of genres into a list
            new_genres_lst = []
            for i in genres.keys():
                new_genres_lst.append(i)
            
            return new_genres_lst
        else:
            print('---------------0 genres')
            print(genres_lst)
            return genres_lst

    def collate_features(self, tracks):
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
        song_error_count = 0

        for i in tracks:
            if self.switch == True:
                features = scc.audio_features(i)

                if type(features[0]) is dict:
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
                    song_error_count += 1
                    self.socketio.emit('failed_scans', {'data': self.song_error_counter})

            if self.switch == True:
                self.retrieved_songs += 1
                self.socketio.emit('retrieved_songs', {'data': self.retrieved_songs})

        return average_features, song_error_count


    def recommendations(self):
        tracks = self.tracks
        genres = self.genres
        artists = self.artists
        average_features = self.average_features

        self.get_recommendations_counter = 0
        self.analyse_recommendations_counter = 0
        self.similarity_recommendations_counter = 0

        if self.switch == True:
            self.socketio.emit('getting_recommendations')
            recommendations = self.get_recommendations(tracks, genres)

        if self.switch == True:
            self.socketio.emit('analysing_recommendations')
            recommendations = self.recommendations_features(recommendations)

        if self.switch == True:
            self.socketio.emit('scoring_recommendations')
            recommendations = self.recommendations_similarity(recommendations, average_features)
            self.recommendations = recommendations

        results = [
            len(tracks),
            len(artists),
            len(genres),
            self.song_error_count
        ]

    def get_recommendations(self, tracks, genres):
        recommendations = []
        recommended_ids = []

        while len(recommended_ids) < len(tracks) and self.switch == True:
            for i in tracks:
                if len(recommended_ids) == len(tracks):
                    return recommendations

                results = scc.recommendations(seed_tracks=[i], limit=1)
                try:
                    track = results['tracks'][0]
                    id = track['id']

                    if id not in tracks:
                        recommended_artists = []
                        for j in track['artists']:
                            # Check if track has been added already
                            if id not in recommended_ids and self.switch == True:
                                # Check for duplicate genres
                                recommended_genres = scc.artist(j['id'])
                                recommended_set = set(recommended_genres['genres'])
                                given_set = set(genres)
                                if (recommended_set & given_set):
                                    # Add artist to recommended artists
                                    recommended_artists.append({
                                        'id': j['id'],
                                        'name': j['name']
                                    })
                                    # Add song to recommendations
                                    recommended_ids.append(id)
                                    recommendations.append({
                                        'id': id,
                                        'explicit': track['explicit'],
                                        'name': track['name'],
                                        'artists': recommended_artists,
                                        'preview': track['preview_url']
                                    })

                                    self.get_recommendations_counter += 1
                                    self.socketio.emit('get_recommendations', {'data': self.get_recommendations_counter})
                except:
                    print(i, 'no results')

        return recommendations
    
    def recommendations_features(self, recommendations):
        for i in recommendations:
            if self.switch == True:
                features = scc.audio_features(i['id'])

                if type(features[0]) is dict:
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

            if self.switch == True:
                self.analyse_recommendations_counter += 1
                self.socketio.emit('analyse_recommendations', {'data': self.analyse_recommendations_counter})

        return recommendations

    def recommendations_similarity(self, recommendations, average_features):
        # Append average feature values to a list
        average_values = []
        for v in average_features.values():
            if self.switch == True:
                average_values.append(v)
        
        # Iterate through tracks
        for i in recommendations:
            if self.switch == True:
                features = i['features']
                # Append track feature values to a list
                feature_values = []
                for v in features.values():
                    feature_values.append(v)
                
                cos_similarity = dot(average_values, feature_values) / (norm(average_values) * norm(feature_values))
                i['similarity'] = cos_similarity

                self.similarity_recommendations_counter += 1
                self.socketio.emit('similarity_recommendations', {'data': self.similarity_recommendations_counter})
        
        if self.switch == True:
            self.socketio.emit('sorting_recommendations')
            return sorted(recommendations, key=lambda d: d['similarity'], reverse=True)



    
    def stop(self):
        self.switch = False




# --------------------------- Functions -----------------------------------

# ? Can I call the below functions from the class
def session_cache_path():
    return caches_folder + session.get('uuid')

def cache_auth():
    cache_handler = spotipy.cache_handler.CacheFileHandler(cache_path=session_cache_path())
    auth_manager = spotipy.oauth2.SpotifyOAuth(scope='user-library-read playlist-read-private playlist-modify-public playlist-modify-private',
                                                cache_handler=cache_handler, 
                                                show_dialog=True)
    return cache_handler, auth_manager


# --------------------------- Routes -----------------------------------
@app.route('/')
def index():
    if not session.get('uuid'):
        session['uuid'] = str(uuid.uuid4())

    cache_handler, auth_manager = cache_auth()

    if request.args.get("code"):
        auth_manager.get_access_token(request.args.get("code"))
        return redirect('/')

    if not auth_manager.validate_token(cache_handler.get_cached_token()):
        return render_template('index.html')

    sp = spotipy.Spotify(auth_manager=auth_manager)

    results = sp.current_user_saved_tracks(limit=1)
    liked_total = results['total']

    results = sp.current_user_playlists()
    playlists = []
    for i in results['items']:
        if i['tracks']['total'] > 0:
            playlists.append({
                'images': i['images'],
                'name': i['name'],
                'tracks': i['tracks'],
                'id': i['id']
            })

    return render_template('home.html', liked_total=liked_total, playlists=playlists)


@app.route('/login')
def login():
    cache_handler, auth_manager = cache_auth()
    return redirect(auth_manager.get_authorize_url())

@app.route('/signout')
def signout():
    try:
        os.remove(session_cache_path())
        session.clear()
    except OSError as e:
        print ("Error: %s - %s." % (e.filename, e.strerror))
    return redirect('/')


@app.route('/scan', methods=['GET', 'POST'])
def scan():
    cache_handler, auth_manager = cache_auth()
    # Check is user has a valid token
    if not auth_manager.validate_token(cache_handler.get_cached_token()):
        return redirect('/')

    if request.method == 'POST':
        id = request.form['scan_btn']

        sp = spotipy.Spotify(auth_manager=auth_manager)
        if id == 'liked songs':
            # Get liked details 
            results = sp.current_user_saved_tracks(limit=1)
            playlist = ['liked songs', '../static/images/liked_songs_cover.png', 'Liked Songs', results['total']]
        else:
            # Get playlist details
            results = sp.playlist(id)
            playlist = [id, results['images'][0]['url'], results['name'], results['tracks']['total']]

        session['playlist'] = playlist
        return render_template('scan.html', async_mode=socketio.async_mode, id=id, playlist=playlist)

    return redirect('/')

@app.route('/store_data', methods=['GET', 'POST'])
def store_data():
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

    socketio.emit('redirect')
    return 'success'

@app.route('/recommend')
def recommend():
    results = [
            len(session['tracks']),
            len(session['artists']),
            len(session['genres']),
            session['song_error_count']
        ]

    return render_template('recommend.html', recommendations=session['recommendations'], playlist=session['playlist'], results=results, average_features=session['average_features'])

@app.route('/addToPlaylist', methods=['GET', 'POST'])
def addToPlaylist():
    if request.method == 'POST':
        cache_handler, auth_manager = cache_auth()
        sp = spotipy.Spotify(auth_manager=auth_manager)

        id = request.form['playlist']
        tracks = json.loads(request.form['tracks'])
        uris = ["spotify:track:" + i for i in tracks]

        if request.form['playlist'] == 'new':
            user_id = sp.me()['id']
            new_playlist = sp.user_playlist_create(user_id, name='Spotify App Playlist')
            id = new_playlist['id']

        # TODO: Loop for every 100 tracks
        sp.playlist_add_items(id, uris)

        return 'success'
    
    return redirect('/')

@socketio.on('connect_event')
def connect_event(message):
    id = message['data']
    playlist = session['playlist']

    global worker
    worker = Worker(socketio, id, playlist, session.get('uuid'))

    socketio.start_background_task(target=worker.scan_playlist)

@socketio.on('disconnect_event')
def disconnect_event():
    worker.stop()

if __name__ == '__main__':
    socketio.run(app)