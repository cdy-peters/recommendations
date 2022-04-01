from audioop import reverse
import spotipy, os
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from flask import Flask


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


def track_info(saved_tracks, track_ids=[], artist_ids=[], collated_features={
    "acousticness": 0,
    "danceability": 0,
    "energy": 0,
    "instrumentalness": 0,
    "liveness": 0,
    "loudness": 0,
    "speechiness": 0,
    "tempo": 0,
    "valence": 0
}, song_counter=0):

    # Iterate through the users saved tracks
    for item in saved_tracks['items']:
        song_counter += 1

        track = item['track']
        track_id = track['id']
        artists = track['artists']
        print(song_counter, track['name'])
        track_ids.append(track_id)
        collated_features, song_error_counter = track_features(track_id, collated_features)

        for artist in artists:
            artist_id = artist['id']
            if artist_id not in artist_ids:
                artist_ids.append(artist_id)

    return track_ids, artist_ids, collated_features, song_counter, song_error_counter

def track_features(track_id, collated_features):
    song_error_counter = 0

    # Get features of each track
    features = scc.audio_features(track_id)

    # Add values for features to a dictionary to later be averaged
    if type(features[0]) is dict:
        collated_features['acousticness'] += features[0]['acousticness']
        collated_features['danceability'] += features[0]['danceability']
        collated_features['energy'] += features[0]['energy']
        collated_features['instrumentalness'] += features[0]['instrumentalness']
        collated_features['liveness'] += features[0]['liveness']
        collated_features['loudness'] += features[0]['loudness']
        collated_features['speechiness'] += features[0]['speechiness']
        collated_features['tempo'] += features[0]['tempo']
        collated_features['valence'] += features[0]['valence']
    else:
        song_error_counter += 1

    return collated_features, song_error_counter

# Get genres of each songs artist
def artist_genres(artist_ids):
    genres = {}
    for artist_id in artist_ids:
        artist = scc.artist(artist_id)
        artist_genres = artist['genres']

        for genre in artist_genres:
            if genre not in genres:
                genres[genre] = 1
            else:
                genres[genre] += 1

    # Remove genres with a value of 1
    temp = []
    for i in genres:
        if genres[i] == 1:
            temp.append(i)
    for i in temp:
        genres.pop(i)

    # Order genres by value
    genres = dict(sorted(genres.items(), key=lambda item: item[1], reverse=True))
    # Make list of the keys
    genres_lst = []
    for k in genres.keys():
        genres_lst.append(k)

    return genres_lst

# Search songs based on genre
def search_genre(genres):
    recommendations = []
    recommended_ids = [] # Temporary list to keep track of which ids are in recommendations

    for i in genres:
        results = scc.search(f'genre:{i}', type='track', limit=50)
        for j in results['tracks']['items']:
            id = j['id']
            if id not in recommended_ids:
                recommended_ids.append(id)
                recommendations.append({'id': id})
    return recommendations

# Get recommended songs
def recommended_tracks(type, ids):  # sourcery skip: avoid-builtin-shadow
    recommendations = []
    recommended_ids = [] # Temporary list to keep track of which ids are in recommendations
    
    for i in ids:
        if type == 'artist':
            results = scc.recommendations(seed_artists=[i], limit=1)
        if type == 'track':
            results = scc.recommendations(seed_tracks=[i], limit=1)
        try:
            id = results['tracks'][0]['id'] 
            if id not in recommended_ids:
                recommended_ids.append(id)
                recommendations.append({'id': id})
        except:
            print('no results')

    return recommendations

def recommended_track_features(recommendations):
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
    return recommendations
