import { Injectable } from '@angular/core';

import { QueryService } from 'src/app/shared/services/query.service';

import {
  AverageSongFeatures,
  Recommendation,
} from 'src/app/shared/models/models';
import {
  ArtistResponse,
  FeaturesResponse,
  RecommendationsResponse,
} from 'src/app/shared/models/spotify-models';

@Injectable({
  providedIn: 'root',
})
export class RecommendationsService {
  constructor(private query: QueryService) {}

  tracks: string[] = [];
  averageFeatures: AverageSongFeatures = new AverageSongFeatures();
  genres: string[] = [];
  genreSeeds: string[] = [];
  allTracks: Set<string> = new Set();

  async filterGenres(genres: { genre: string; frequency: number }[]) {
    // Sort genres by frequency
    genres.sort((a, b) => b.frequency - a.frequency);

    // Filter out genres that are less than iqr
    var q1 = genres[Math.floor((genres.length * 3) / 4)].frequency;
    var q3 = genres[Math.floor(genres.length / 4)].frequency;
    var iqr = q3 - q1;
    genres = genres.filter((genre) => genre.frequency > iqr);
    this.genres = genres.map((genre) => genre.genre);
    console.log('filter by iqr', iqr, genres);

    // Get any valid genre seeds
    var url = `https://api.spotify.com/v1/recommendations/available-genre-seeds`;
    var availableGenreSeeds = <{ genres: string[] }>await this.query.get(url);

    for (const genre of genres) {
      if (availableGenreSeeds.genres.includes(genre.genre)) {
        this.genreSeeds.push(genre.genre);
      }
    }
    console.log('genre seeds', this.genreSeeds);
  }

  async fetchRecommendations() {
    var recommendations: Recommendation[] = [];

    // Get seed for recommendations
    var seeds: { genre: string[]; track: string[] } = { genre: [], track: [] };

    if (this.genreSeeds.length > 0) {
      seeds.genre = this.genreSeeds.slice(0, 2);
      this.genreSeeds = this.genreSeeds
        .slice(seeds.genre.length)
        .concat(this.genreSeeds.slice(0, seeds.genre.length));
    }

    seeds.track = this.tracks.slice(0, 5 - seeds.genre.length);
    this.tracks = this.tracks
      .slice(seeds.track.length)
      .concat(this.tracks.slice(0, seeds.track.length));

    var seed = '';
    if (seeds.genre.length > 0) {
      seed = `seed_genres=${seeds.genre.join(',')}&`;
    }
    seed += `seed_tracks=${seeds.track.join(',')}`;

    // Get recommendations
    var filters = `target_acousticness=${this.averageFeatures.acousticness}&target_danceability=${this.averageFeatures.danceability}&target_energy=${this.averageFeatures.energy}&target_instrumentalness=${this.averageFeatures.instrumentalness}&target_liveness=${this.averageFeatures.liveness}&target_loudness=${this.averageFeatures.loudness}&target_speechiness=${this.averageFeatures.speechiness}&target_tempo=${this.averageFeatures.tempo}&target_valence=${this.averageFeatures.valence}`;
    var url = `https://api.spotify.com/v1/recommendations?${seed}&limit=10&${filters}`;
    console.log(url);
    var recommendationsRes = <RecommendationsResponse>await this.query.get(url);

    for (const track of recommendationsRes.tracks) {
      if (!this.allTracks.has(track.id)) {
        // Check if track has familiar genres
        var genreExists = false;
        for (const artist of track.artists) {
          var url = `https://api.spotify.com/v1/artists/${artist.id}`;
          var artistData = <ArtistResponse>await this.query.get(url);
          var genres = artistData.genres;

          const exists = genres.some((g) => this.genres.indexOf(g) >= 0);
          if (exists) {
            genreExists = true;
            break;
          }
        }
        if (!genreExists) {
          console.log('No familiar genres');
          continue;
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

        this.allTracks.add(track.id);
        recommendations.push({
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
    return recommendations;
  }

  async getRecommendations(data?: any) {
    if (data) {
      this.tracks = data.tracks;
      this.averageFeatures = data.averageFeatures;

      for (const track of this.tracks) this.allTracks.add(track);

      await this.filterGenres(data.genres);
    }

    var recommendations = await this.fetchRecommendations();

    return recommendations;
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
