from django.shortcuts import render
import spotipy, os, requests, base64, config, six, uuid, time
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from flask import Flask, render_template, request, redirect, session
from flask_session import Session
from numpy import dot
from numpy.linalg import norm

# Init App
app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(64)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './.flask_session/'
Session(app)

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


# --------------------------- Functions -----------------------------------

def session_cache_path():
    return caches_folder + session.get('uuid')

def cache_auth():
    cache_handler = spotipy.cache_handler.CacheFileHandler(cache_path=session_cache_path())
    auth_manager = spotipy.oauth2.SpotifyOAuth(scope='user-library-read',
                                                cache_handler=cache_handler, 
                                                show_dialog=True)
    return cache_handler, auth_manager


# # Scan Song Functions
def append_songs(tracks, artists, results):
    for i in results['items']:
        track_id = i['track']['id']
        tracks.append(track_id)

        for j in i['track']['artists']:
            if j['id'] not in artists:
                artists.append(j['id'])
        
    return tracks, artists

def artist_genres(artists):
    genres = {}
    # Get genres of each artist
    for i in artists:
        results = scc.artist(i) # TODO: Do something if no results are returned
        for j in results['genres']:
            if j not in genres:
                genres[j] = 1
            else:
                genres[j] += 1

    # Order genres by value
    genres = dict(sorted(genres.items(), key=lambda item: item[1], reverse=True))

    # Make list of keys with values greater than 1
    genres_lst = []
    for i in genres:
        if genres[i] != 1:
            genres_lst.append(i)
        else:
            break

    return genres_lst

def collate_features(tracks):
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
            song_error_count += 1
    
    return average_features, song_error_count

def scan_playlist(id):
    cache_handler, auth_manager = cache_auth()
    sp = spotipy.Spotify(auth_manager=auth_manager)

    # Get songs and artists of playlist
    results = sp.playlist_tracks(id)
    tracks, artists = append_songs([], [], results)
    while results['next']:
        results = sp.next(results)
        tracks, artists = append_songs(tracks, artists, results)

    # Get genres of artists
    genres = artist_genres(artists)

    # Get average feature values
    average_features, song_error_count = collate_features(tracks)
    for i in average_features:
        average_features[i] = round(average_features[i] / (len(tracks) - song_error_count), 5)    

    return tracks, artists, genres, average_features, song_error_count


# Recommended Song Functions
def track_recommend(tracks):
    recommendations = []
    recommended_ids = []

    for i in tracks:
        results = scc.recommendations(seed_tracks=[i], limit=1)
        try:
            track = results['tracks'][0]
            id = track['id']

            recommended_artists = []
            for w in track['artists']:
                recommended_artists.append(w['name'])

            if id not in recommended_ids:
                recommended_ids.append(id)
                recommendations.append({
                    'id': id,
                    'explicit': track['explicit'],
                    'name': track['name'],
                    'artists': recommended_artists,
                    'preview': track['preview_url']
                })
        except:
            print(i, 'no results')

    return recommendations

def artist_recommend(artists):
    recommendations = []
    recommended_ids = []

    for i in artists:
        results = scc.recommendations(seed_artists=[i], limit=1)
        try:
            track = results['tracks'][0]
            id = track['id']

            recommended_artists = []
            for w in track['artists']:
                recommended_artists.append(w['name'])

            if id not in recommended_ids:
                recommended_ids.append(id)
                recommendations.append({
                    'id': id,
                    'explicit': track['explicit'],
                    'name': track['name'],
                    'artists': recommended_artists,
                    'preview': track['preview_url']
                })
        except:
            print('no results')

    return recommendations

def genre_recommend(genres):
    recommendations = []
    recommended_ids = []

    for i in genres:
        results = scc.search(f'genre:{i}', type='track', limit=10)
        print(results)
        for j in results['tracks']['items']:
            id = j['id']

            recommended_artists = []
            for w in j['artists']:
                recommended_artists.append(w['name'])

            if id not in recommended_ids:
                recommended_ids.append(id)
                recommendations.append({
                    'id': id,
                    'explicit': j['explicit'],
                    'name': j['name'],
                    'artists': recommended_artists,
                    'preview': j['preview_url']
                })

    return recommendations

def recommendations_features(recommendations):
    for i in recommendations:
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

    return recommendations

def recommendations_similarity(recommendations, average_features):
    # Append average feature values to a list
    average_values = []
    for v in average_features.values():
        average_values.append(v)

    # Iterate through tracks
    for i in recommendations:
        features = i['features']
        # Append track feature values to a list
        feature_values = []
        for v in features.values():
            feature_values.append(v)

        cos_similarity = dot(average_values, feature_values) / (norm(average_values) * norm(feature_values))
        i['similarity'] = cos_similarity

    return sorted(recommendations, key=lambda d: d['similarity'], reverse=True) # Return dictionary sorted by similarity




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

    results = sp.current_user_playlists()
    playlists = []
    for i in results['items']:
        playlists.append({
            'images': i['images'],
            'name': i['name'],
            'tracks': i['tracks'],
            'id': i['id']
        })

    return render_template('home.html', playlists=playlists)

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
        
        if id == 'liked songs':
            pass
        else:
            print(id)
            results = scan_playlist(id)
            session['song_results'] = results

        return render_template('scan.html', results=results)

    return redirect('/')

@app.route('/recommend', methods=['GET', 'POST'])
def recommend():
    cache_handler, auth_manager = cache_auth()
    if not auth_manager.validate_token(cache_handler.get_cached_token()):
        return redirect('/')

    if request.method == 'POST':
        recommend_type = request.form['type']
        average_features = session['song_results'][3]

        if recommend_type == 'track':
            tracks = session['song_results'][0]
            recommendations = track_recommend(tracks)

        elif recommend_type == 'artist':
            artists = session['song_results'][1]
            recommendations = artist_recommend(artists)

        else:
            genres = session['song_results'][2]
            recommendations = genre_recommend(genres)

        recommendations = recommendations_features(recommendations)
        recommendations = recommendations_similarity(recommendations, average_features)
        # TODO: Remove duplicate tracks
        # TODO: Remove tracks with no comparable genres
        
        return render_template('recommend.html', recommendations=recommendations)

    return redirect('/')



# @app.route('/recommend', methods=('GET', 'POST'))
# def recommend():
#     if request.method == 'GET':
#         return render_template('recommended_songs.html')
#     # First pass (do): GET user saved songs
#     # TODO: Remove Spotipy methods from app.py, having all Spotipy logic in functions.py
#     saved_tracks = soa.current_user_saved_tracks(10)
#     track_ids, artist_ids, collated_features, song_counter, song_error_counter = track_info(saved_tracks)

#     # * Below will iterate through all songs, otherwise limited to 5 with the argument of current_user_saved_tracks()
#     # # Continue to GET user saved songs until none are left
#     while saved_tracks['next']:
#         saved_tracks = soa.next(saved_tracks)
#         track_ids, artist_ids, collated_features, song_counter, song_error_counter = track_info(saved_tracks, track_ids, artist_ids, collated_features, song_counter)

#     for i in collated_features:
#         collated_features[i] = round(collated_features[i] / (song_counter - song_error_counter), 5)
#     print(track_ids, artist_ids, collated_features, song_counter, song_error_counter)


#     recommend_mode = input("How do you want to get recommendations? (genres/g, artists/a, tracks/t): ")

#     if recommend_mode in ['genres', 'g']:
#         genres = artist_genres(artist_ids)
#         recommendations = search_genre(genres)

#     elif recommend_mode in ['artists', 'a']:
#         recommendations = recommended_tracks('artist', artist_ids)

#     elif recommend_mode in ['tracks', 't']:
#         recommendations = recommended_tracks('track', track_ids)

#     else:
#         print('Invalid input')

#     # Removes duplicate tracks from recommended and saved tracks
#     print('recommended tracks retrieved')
#     # temp = []
#     # for i in recommendations:
#     #     if i['id'] in track_ids:
#     #         temp.append(i['id'])
#     # for i in temp:
#     #     recommendations.pop(i)
#     # del temp
#     print('duplicate tracks removed')

#     recommendations = recommended_track_features(recommendations)
#     recommendations = cos_similarity(recommendations, collated_features)
#     print(recommendations)

#     return render_template('recommended_songs.html')