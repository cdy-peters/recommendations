import spotipy, os
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from flask import Flask, render_template
from functions import *

app = Flask(__name__)
app.config.from_object("config.DevelopmentConfig")

os.environ['SPOTIPY_CLIENT_ID']=app.config['SPOTIPY_CLIENT_ID']
os.environ['SPOTIPY_CLIENT_SECRET']=app.config['SPOTIPY_CLIENT_SECRET']
os.environ['SPOTIPY_REDIRECT_URI']=app.config['SPOTIPY_REDIRECT_URI']

scope = "user-library-read"
# OAuth Init
soa = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))

# Client Credentials Init
client_credentials_manager = SpotifyClientCredentials()
scc = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
scc.trace = True


@app.route('/')
def index():
    return 'Hello World!'

@app.route('/recommend')
def recommend():
    # First pass (do): GET user saved songs
    # TODO: Remove Spotipy methods from app.py, having all Spotipy logic in functions.py
    saved_tracks = soa.current_user_saved_tracks(10)
    track_ids, artist_ids, collated_features, song_counter, song_error_counter = track_info(saved_tracks)

    # * Below will iterate through all songs, otherwise limited to 5 with the argument of current_user_saved_tracks()
    # # Continue to GET user saved songs until none are left
    # while saved_tracks['next']:
    #     saved_tracks = soa.next(saved_tracks)
    #     track_ids, artist_ids, collated_features, song_counter, song_error_counter = track_info(saved_tracks, track_ids, artist_ids, collated_features, song_counter)

    for i in collated_features:
        collated_features[i] = round(collated_features[i] / (song_counter - song_error_counter), 5)
    print(track_ids, artist_ids, collated_features, song_counter, song_error_counter)


    recommend_mode = input("How do you want to get recommendations? (genres/g, artists/a, tracks/t): ")
    # TODO: Remove duplicate track IDs from recommendations
    if recommend_mode in ['genres', 'g']:
        genres = artist_genres(artist_ids)
        recommendations = search_genre(genres)

    elif recommend_mode in ['artists', 'a']:
        recommendations = recommended_tracks('artist', artist_ids)

    elif recommend_mode in ['tracks', 't']:
        recommendations = recommended_tracks('track', track_ids)

    else:
        print('Invalid input')

    temp = []
    for i in recommendations:
        if i['id'] in track_ids:
            temp.append(i['id'])
    for i in temp:
        recommendations.pop(i)

    recommendations = recommended_track_features(recommendations)
    recommendations = cos_similarity(recommendations, collated_features)
    print(recommendations)

    return render_template('recommended_songs.html')