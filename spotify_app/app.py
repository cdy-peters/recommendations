import spotipy, os, requests, base64, config, six, uuid, time
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from flask import Flask, render_template, request, redirect, session
from flask_session import Session

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

caches_folder = './.spotify_caches'
if not os.path.exists(caches_folder):
    os.makedirs(caches_folder)


# --------------------------- Functions -----------------------------------

def session_cache_path():
    return caches_folder + session.get('uuid')

def cache_auth():
    cache_handler = spotipy.cache_handler.CacheFileHandler(cache_path=session_cache_path())
    auth_manager = spotipy.oauth2.SpotifyOAuth(scope='user-read-currently-playing playlist-modify-private',
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

    return render_template('home.html')

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





@app.route('/recommend', methods=('GET', 'POST'))
def recommend():
    if request.method == 'GET':
        return render_template('recommended_songs.html')
    # First pass (do): GET user saved songs
    # TODO: Remove Spotipy methods from app.py, having all Spotipy logic in functions.py
    saved_tracks = soa.current_user_saved_tracks(10)
    track_ids, artist_ids, collated_features, song_counter, song_error_counter = track_info(saved_tracks)

    # * Below will iterate through all songs, otherwise limited to 5 with the argument of current_user_saved_tracks()
    # # Continue to GET user saved songs until none are left
    while saved_tracks['next']:
        saved_tracks = soa.next(saved_tracks)
        track_ids, artist_ids, collated_features, song_counter, song_error_counter = track_info(saved_tracks, track_ids, artist_ids, collated_features, song_counter)

    for i in collated_features:
        collated_features[i] = round(collated_features[i] / (song_counter - song_error_counter), 5)
    print(track_ids, artist_ids, collated_features, song_counter, song_error_counter)


    recommend_mode = input("How do you want to get recommendations? (genres/g, artists/a, tracks/t): ")

    if recommend_mode in ['genres', 'g']:
        genres = artist_genres(artist_ids)
        recommendations = search_genre(genres)

    elif recommend_mode in ['artists', 'a']:
        recommendations = recommended_tracks('artist', artist_ids)

    elif recommend_mode in ['tracks', 't']:
        recommendations = recommended_tracks('track', track_ids)

    else:
        print('Invalid input')

    # Removes duplicate tracks from recommended and saved tracks
    print('recommended tracks retrieved')
    # temp = []
    # for i in recommendations:
    #     if i['id'] in track_ids:
    #         temp.append(i['id'])
    # for i in temp:
    #     recommendations.pop(i)
    # del temp
    print('duplicate tracks removed')

    recommendations = recommended_track_features(recommendations)
    recommendations = cos_similarity(recommendations, collated_features)
    print(recommendations)

    return render_template('recommended_songs.html')