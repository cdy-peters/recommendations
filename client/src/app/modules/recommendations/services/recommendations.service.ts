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
  recommendations: Recommendation[] = [];
  limit: number = 25;
  checkGenres: boolean = true;

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
    console.log(this.limit);
    var filters = `target_acousticness=${this.averageFeatures.acousticness}&target_danceability=${this.averageFeatures.danceability}&target_energy=${this.averageFeatures.energy}&target_instrumentalness=${this.averageFeatures.instrumentalness}&target_liveness=${this.averageFeatures.liveness}&target_loudness=${this.averageFeatures.loudness}&target_speechiness=${this.averageFeatures.speechiness}&target_tempo=${this.averageFeatures.tempo}&target_valence=${this.averageFeatures.valence}`;
    var url = `https://api.spotify.com/v1/recommendations?${seed}&limit=${this.limit}&${filters}`;
    console.log(url);
    var recommendationsRes = <RecommendationsResponse>await this.query.get(url);

    for (const track of recommendationsRes.tracks) {
      if (!this.allTracks.has(track.id)) {
        // Check if track has familiar genres
        if (this.checkGenres) {
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
        }

        var artists = track.artists.map((a) => a.name);

        this.allTracks.add(track.id);
        this.recommendations.push({
          id: track.id,
          name: track.name,
          artists: artists,
          explicit: track.explicit,
          preview_url: track.preview_url,
        });

        if (this.recommendations.length >= 20) break;
      } else {
        console.log('Track already in playlist');
      }
    }
  }

  async getRecommendations(data?: any) {
    if (data) {
      this.tracks = data.tracks;
      this.averageFeatures = data.averageFeatures;

      // Randomize tracks
      this.tracks = this.tracks
        .map((a) => ({ sort: Math.random(), value: a }))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value);

      for (const track of this.tracks) this.allTracks.add(track);

      await this.filterGenres(data.genres);
    }

    this.recommendations = [];
    var count = 0;

    while (this.recommendations.length < 20) {
      if (count === 3) {
        if (this.limit < 100) {
          this.limit += 25;
        } else if (this.limit === 100 && this.checkGenres) {
          this.checkGenres = false;
        } else {
          break;
        }
      }
      await this.fetchRecommendations();
      count++;
    }

    // Compare average features to recommendation features
    var ids = this.recommendations.map((i) => i.id);

    var url = `https://api.spotify.com/v1/audio-features?ids=${ids.join(',')}`;
    var audioFeatures = <any>await this.query.get(url);
    audioFeatures = <FeaturesResponse[]>audioFeatures.audio_features;

    for (const features of audioFeatures) {
      var id = features.id;
      var featuresArr = [
        features.acousticness,
        features.danceability,
        features.energy,
        features.instrumentalness,
        features.liveness,
        features.loudness,
        features.speechiness,
        features.tempo,
        features.valence,
      ];

      var rec = this.recommendations.filter((r) => r.id == id);
      rec[0].similarity = this.calcSimilarity(featuresArr);
    }

    return this.recommendations;
  }

  // Calculates cosine similarity between two vectors
  calcSimilarity(featuresArr: any) {
    var avgArr: number[] = Object.values(this.averageFeatures);

    const dot = (a: any[], b: any[]) =>
      a.map((x: any, i: any) => x * b[i]).reduce((m: any, n: any) => m + n);
    const norm = (a: any[]) => Math.sqrt(dot(a, a));

    var sim = dot(avgArr, featuresArr) / (norm(avgArr) * norm(featuresArr));
    return +sim.toFixed(5);
  }
}
