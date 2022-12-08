import { Injectable } from '@angular/core';

import { QueryService } from 'src/app/shared/services/query.service';

import {
  AverageSongFeatures,
  Recommendation,
} from 'src/app/shared/models/models';
import {
  FeaturesResponse,
  RecommendationsResponse,
} from 'src/app/shared/models/spotify-models';

@Injectable({
  providedIn: 'root',
})
export class RecommendationsService {
  constructor(private query: QueryService) {}

  selectedPlaylist: any;
  tracks: string[] = [];
  averageFeatures: AverageSongFeatures = new AverageSongFeatures();
  genres: {
    name: string;
    frequency: number;
  }[] = [];
  filteredGenres: string[] = [];
  recommendations: Recommendation[] = [];

  async getRecommendations(data: any) {
    this.selectedPlaylist = data.selectedPlaylist;
    this.tracks = data.tracks;
    this.averageFeatures = data.averageFeatures;
    this.genres = data.genres;

    var seed_method = 'genres';

    // Set marquee
    setTitleMarquee('#playlist_details > h5', this.selectedPlaylist.name, 200);

    // Filter genres
    var url = `https://api.spotify.com/v1/recommendations/available-genre-seeds`;
    var genre_seeds = (await this.query.get(url)) as { genres: string[] };

    this.filteredGenres = [];
    // Filter out genres that are not in the genre seeds or have a frequency of 1
    for (const genre of this.genres) {
      if (genre.frequency > 1) {
        if (genre_seeds.genres.includes(genre.name)) {
          this.filteredGenres.push(genre.name);
        }
      }
    }
    // If there are enough genres, continue to seed the recommendations with the top 5 genres
    // Else, recommendations will be seeded with tracks and compared with genres
    if (this.filteredGenres.length > 3) {
      this.filteredGenres = this.filteredGenres.slice(0, 5);
    } else {
      seed_method = 'tracks';
      this.filteredGenres = [];

      for (const genre of this.genres) {
        if (genre.frequency > 1) {
          this.filteredGenres.push(genre.name);
        }
      }

      // If there are too few genres (due to a small playlist), add all genres including those with a frequency of 1
      if (this.filteredGenres.length <= 3) {
        this.filteredGenres = [];

        for (const genre of this.genres) {
          this.filteredGenres.push(genre.name);
        }
      }
    }

    // Get recommendations
    var recommendations;
    if (seed_method === 'genres') {
      console.log('genres');
      var url = `https://api.spotify.com/v1/recommendations?seed_genres=${this.filteredGenres.join(
        ','
      )}&limit=10&target_acousticness=${
        this.averageFeatures.acousticness
      }&target_danceability=${
        this.averageFeatures.danceability
      }&target_energy=${this.averageFeatures.energy}&target_instrumentalness=${
        this.averageFeatures.instrumentalness
      }&target_liveness=${this.averageFeatures.liveness}&target_loudness=${
        this.averageFeatures.loudness
      }&target_speechiness=${this.averageFeatures.speechiness}&target_tempo=${
        this.averageFeatures.tempo
      }&target_valence=${this.averageFeatures.valence}`;
      recommendations = <RecommendationsResponse>await this.query.get(url);
    } else {
      var tracksTemp = this.tracks.slice(0, 5);
      var url = `https://api.spotify.com/v1/recommendations?seed_tracks=${tracksTemp.join(
        ','
      )}&limit=10&target_acousticness=${
        this.averageFeatures.acousticness
      }&target_danceability=${
        this.averageFeatures.danceability
      }&target_energy=${this.averageFeatures.energy}&target_instrumentalness=${
        this.averageFeatures.instrumentalness
      }&target_liveness=${this.averageFeatures.liveness}&target_loudness=${
        this.averageFeatures.loudness
      }&target_speechiness=${this.averageFeatures.speechiness}&target_tempo=${
        this.averageFeatures.tempo
      }&target_valence=${this.averageFeatures.valence}`;
      recommendations = <RecommendationsResponse>await this.query.get(url);
    }

    for (const track of recommendations.tracks) {
      if (!this.tracks.includes(track.id)) {
        // Check if track has familiar genres
        if (seed_method !== 'genres') {
          var genreExists = false;
          for (const artist of track.artists) {
            var url = `https://api.spotify.com/v1/artists/${artist.id}`;
            var artistData = (await this.query.get(url)) as {
              genres: string[];
            };
            var genres = artistData.genres;

            const exists = genres.some(
              (genre) => this.filteredGenres.indexOf(genre) >= 0
            );
            if (exists) {
              genreExists = true;
              break;
            }
          }
          if (!genreExists) {
            console.log('No familiar genres');
            continue;
          }
        }

        // Compare song features with average song features
        var url = `https://api.spotify.com/v1/audio-features/${track.id}`;
        var audio_features = <FeaturesResponse>await this.query.get(url);
        var features = {
          acousticness: audio_features.acousticness,
          danceability: audio_features.danceability,
          energy: audio_features.energy,
          instrumentalness: audio_features.instrumentalness,
          liveness: audio_features.liveness,
          loudness: audio_features.loudness,
          speechiness: audio_features.speechiness,
          tempo: audio_features.tempo,
          valence: audio_features.valence,
        };

        var sim = this.calcSimilarity(this.averageFeatures, features);

        var artists = [];
        for (const artist of track.artists) {
          artists.push(artist.name);
        }

        this.recommendations.push({
          id: track.id,
          name: track.name,
          artists: artists,
          explicit: track.explicit,
          preview_url: track.preview_url,
          similarity: sim,
        });
      } else {
        console.log('Track already in playlist');
      }
    }
    return this.recommendations;
  }

  // Calculates cosine similarity between two vectors
  calcSimilarity(average_features: any, features: any) {
    var avgArr: number[] = Object.values(average_features);
    var featuresArr: number[] = Object.values(features);

    const dot = (a: any[], b: any[]) =>
      a.map((x: any, i: any) => x * b[i]).reduce((m: any, n: any) => m + n);
    const norm = (a: any[]) => Math.sqrt(dot(a, a));

    var sim = dot(avgArr, featuresArr) / (norm(avgArr) * norm(featuresArr));
    return +sim.toFixed(5);
  }
}
