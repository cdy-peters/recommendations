import { EventEmitter, Injectable } from '@angular/core';

import { QueryService } from 'src/app/shared/services/query.service';

import {
  AverageSongFeatures,
  Recommendation
} from 'src/app/shared/models/models';
import {
  ArtistResponse,
  FeaturesResponse,
  RecommendationsResponse
} from 'src/app/shared/models/spotify-models';

@Injectable({
  providedIn: 'root',
})
export class RecommendationsService {
  constructor(private query: QueryService) {}

  tracks: string[] = [];
  averageFeatures: AverageSongFeatures = new AverageSongFeatures();
  genres: string[] = [];
  artists: {
    id: string;
    genres: string[];
  }[] = [];

  genreSeeds: string[] = [];
  limit: number = 25;
  recommendations: Recommendation[] = [];
  recommendationsChanged = new EventEmitter<number>();
  allTracks: Set<string> = new Set();
  checkRecommendations: boolean = true;
  invalidTrack: Set<string> = new Set();

  async filterGenres(genres: { genre: string; frequency: number }[]) {
    // Sort genres by frequency
    genres.sort((a, b) => b.frequency - a.frequency);

    // Filter out genres that are less than iqr
    var q1 = genres[Math.floor((genres.length * 3) / 4)].frequency;
    var q3 = genres[Math.floor(genres.length / 4)].frequency;
    var iqr = q3 - q1;
    genres = genres.filter((genre) => genre.frequency > iqr);
    this.genres = genres.map((genre) => genre.genre);

    // Get any valid genre seeds
    var url = `https://api.spotify.com/v1/recommendations/available-genre-seeds`;
    var availableGenreSeeds = <{ genres: string[] }>await this.query.get(url);

    for (const genre of genres) {
      if (availableGenreSeeds.genres.includes(genre.genre))
        this.genreSeeds.push(genre.genre);
    }
  }

  getSeed() {
    // Get seed for recommendations
    var seeds: { genre: string[]; track: string[] } = { genre: [], track: [] };

    // if (this.genreSeeds.length > 0) {
    //   seeds.genre = this.genreSeeds.slice(0, 2);
    //   this.genreSeeds = this.genreSeeds
    //     .slice(seeds.genre.length)
    //     .concat(this.genreSeeds.slice(0, seeds.genre.length));
    // }

    seeds.track = this.tracks.slice(0, 5 - seeds.genre.length);
    this.tracks = this.tracks
      .slice(seeds.track.length)
      .concat(this.tracks.slice(0, seeds.track.length));

    var seed = '';
    // if (seeds.genre.length > 0) seed = `seed_genres=${seeds.genre.join(',')}&`;
    seed += `seed_tracks=${seeds.track.join(',')}`;

    return seed;
  }

  async checkRecommendation(track: any) {
    if (this.invalidTrack.has(track.id)) return 0;

    var artists: string[] = [];
    for (const artist of track.artists) {
      // Check for familiar artists
      const index = this.artists.findIndex((a) => a.id == artist.id);
      if (index != -1) return 1;

      artists.push(artist.id);
    }

    // Get artist genres
    var genresSet: Set<string> = new Set();
    var url = `https://api.spotify.com/v1/artists?ids=${artists.join(',')}`;
    var artistData = <any>await this.query.get(url);
    artistData = <ArtistResponse>artistData.artists;

    for (const artist of artistData)
      for (const genre of artist.genres) genresSet.add(genre);

    // Check for familiar genres
    var genres = Array.from(genresSet);
    const exists = genres.some((g) => this.genres.indexOf(g) >= 0);
    if (!exists) {
      this.invalidTrack.add(track.id);
      return 0;
    }

    return 1;
  }

  async fetchRecommendations() {
    // Get recommendations
    var filters = `target_acousticness=${this.averageFeatures.acousticness}&target_danceability=${this.averageFeatures.danceability}&target_energy=${this.averageFeatures.energy}&target_instrumentalness=${this.averageFeatures.instrumentalness}&target_liveness=${this.averageFeatures.liveness}&target_loudness=${this.averageFeatures.loudness}&target_speechiness=${this.averageFeatures.speechiness}&target_tempo=${this.averageFeatures.tempo}&target_valence=${this.averageFeatures.valence}`;
    var url = `https://api.spotify.com/v1/recommendations?${this.getSeed()}&limit=${
      this.limit
    }&${filters}`;

    var recommendationsRes = <RecommendationsResponse>await this.query.get(url);

    for (const track of recommendationsRes.tracks) {
      if (this.allTracks.has(track.id)) continue;

      if (this.checkRecommendations && !(await this.checkRecommendation(track)))
        continue;

      this.allTracks.add(track.id);
      this.recommendations.push({
        id: track.id,
        name: track.name,
        artists: track.artists.map((a) => a.name),
        explicit: track.explicit,
        preview_url: track.preview_url,
      });
      this.recommendationsChanged.emit(this.recommendations.length);

      if (this.recommendations.length >= 20) break;
    }
  }

  async getRecommendations(data?: any) {
    if (data) {
      this.tracks = data.tracks;
      this.averageFeatures = data.averageFeatures;
      this.artists = data.artists;

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
        } else if (this.limit === 100 && this.checkRecommendations) {
          this.checkRecommendations = false;
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
