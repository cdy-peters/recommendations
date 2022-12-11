import { Injectable } from '@angular/core';

import { QueryService } from 'src/app/shared/services/query.service';

import {
  AverageSongFeatures,
  Recommendation,
} from 'src/app/shared/models/models';
import {
  FeaturesResponse,
  RecommendationsResponse,
  ArtistResponse,
} from 'src/app/shared/models/spotify-models';

@Injectable({
  providedIn: 'root',
})
export class RecommendationsService {
  constructor(private query: QueryService) {}

  tracks: string[] = [];
  averageFeatures: AverageSongFeatures = new AverageSongFeatures();
  filteredGenres: string[] = [];
  recommendations: Recommendation[] = [];
  seed_method: string = 'genres';

  async filterGenres(genres: { genre: string; frequency: number }[]) {
    // TODO: Refactor/rewrite this function
    // Filter genres
    var url = `https://api.spotify.com/v1/recommendations/available-genre-seeds`;
    var genre_seeds = <{ genres: string[] }>await this.query.get(url);

    this.filteredGenres = [];
    // Filter out genres that are not in the genre seeds or have a frequency of 1
    for (const genre of genres) {
      if (genre.frequency > 1) {
        if (genre_seeds.genres.includes(genre.genre)) {
          this.filteredGenres.push(genre.genre);
        }
      }
    }
    // If there are enough genres, continue to seed the recommendations with the top 5 genres
    // Else, recommendations will be seeded with tracks and compared with genres
    if (this.filteredGenres.length > 3) {
      this.filteredGenres = this.filteredGenres.slice(0, 5);
    } else {
      this.seed_method = 'tracks';
      this.filteredGenres = [];

      for (const genre of genres) {
        if (genre.frequency > 1) {
          this.filteredGenres.push(genre.genre);
        }
      }

      // If there are too few genres (due to a small playlist), add all genres including those with a frequency of 1
      if (this.filteredGenres.length <= 3) {
        this.filteredGenres = [];

        for (const genre of genres) {
          this.filteredGenres.push(genre.genre);
        }
      }
    }
  }

  async fetchRecommendations() {
    // Get recommendations
    var seed = '';

    if (this.seed_method === 'genres') {
      var genresTemp = this.filteredGenres.slice(0, 5);
      seed = `seed_genres=${genresTemp.join(',')}`;
    } else {
      var tracksTemp = this.tracks.slice(0, 5);
      seed = `seed_tracks=${tracksTemp.join(',')}`;
    }

    var filters = `target_acousticness=${this.averageFeatures.acousticness}&target_danceability=${this.averageFeatures.danceability}&target_energy=${this.averageFeatures.energy}&target_instrumentalness=${this.averageFeatures.instrumentalness}&target_liveness=${this.averageFeatures.liveness}&target_loudness=${this.averageFeatures.loudness}&target_speechiness=${this.averageFeatures.speechiness}&target_tempo=${this.averageFeatures.tempo}&target_valence=${this.averageFeatures.valence}`;
    var url = `https://api.spotify.com/v1/recommendations?${seed}&limit=10&${filters}`;
    var recommendations = <RecommendationsResponse>await this.query.get(url);

    for (const track of recommendations.tracks) {
      if (!this.tracks.includes(track.id)) {
        // Check if track has familiar genres
        if (this.seed_method !== 'genres') {
          var genreExists = false;
          for (const artist of track.artists) {
            var url = `https://api.spotify.com/v1/artists/${artist.id}`;
            var artistData = <ArtistResponse>await this.query.get(url);
            var genres = artistData.genres;

            const exists = genres.some(
              (g) => this.filteredGenres.indexOf(g) >= 0
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

        var sim = this.calcSimilarity(features);

        var artists = track.artists.map((a) => a.name);

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
  }

  async getRecommendations(data?: any) {
    if (data) {
      this.tracks = data.tracks;
      this.averageFeatures = data.averageFeatures;

      await this.filterGenres(data.genres);
    }

    await this.fetchRecommendations();

    return this.recommendations;
  }

  // Calculates cosine similarity between two vectors
  calcSimilarity(features: any) {
    var avgArr: number[] = Object.values(this.averageFeatures);
    var featuresArr: number[] = Object.values(features);

    const dot = (a: any[], b: any[]) =>
      a.map((x: any, i: any) => x * b[i]).reduce((m: any, n: any) => m + n);
    const norm = (a: any[]) => Math.sqrt(dot(a, a));

    var sim = dot(avgArr, featuresArr) / (norm(avgArr) * norm(featuresArr));
    return +sim.toFixed(5);
  }
}
