import spotipy, os
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials

# ? Get all saved tracks
scope = "user-library-read"

def saved_tracks(results, collated_features, genres, song_counter, scan_error_counter):
    # Iterate through the users saved tracks
    for item in results['items']:
        song_counter += 1
        track = item['track']
        track_id = track['id']
        artist_id = track['artists'][0]['id']

        # Get features and genres of all songs
        collated_features, genres, scan_error_counter = track_features(track_id, artist_id, collated_features, genres, scan_error_counter)

    return collated_features, song_counter, scan_error_counter

def track_features(track_id, artist_id, collated_features, genres, scan_error_counter):
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

        genres = artist_genres(artist_id, genres)
    else:
        scan_error_counter += 1

    return collated_features, genres, scan_error_counter

# TODO: Append genres of each artist to dictionary
# Get genres of each songs artist
def artist_genres(artist_id, genres):
    pass

# TODO: Using collated_features and the top 5 genres, get recommended song
# Get recommended songs
def recommendations(collated_features, genres):
    pass

soa = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))

client_credentials_manager = SpotifyClientCredentials()
scc = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
scc.trace = True

results = soa.current_user_saved_tracks(5)
collated_features = {
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
genres = {}
collated_features, song_counter, scan_error_counter = saved_tracks(results, collated_features, genres, 0, 0)

# * Below will iterate through all songs, otherwise limited to 5 with the argument of current_user_saved_tracks()
# # Continue to GET user saved songs until none are left
# while results['next']:
#     results = soa.next(results)
#     collated_features, song_counter, scan_error_counter = saved_tracks(results, collated_features, genres, song_counter, scan_error_counter)

for i in collated_features:
    collated_features[i] = round(collated_features[i] / (song_counter - scan_error_counter), 5)
print(collated_features)