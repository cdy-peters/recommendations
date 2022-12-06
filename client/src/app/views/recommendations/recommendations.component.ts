import { Component, ViewChild, ElementRef } from '@angular/core';

import { QueryService } from 'src/app/services/query.service';
import { TransferDataService } from 'src/app/services/transfer-data.service';

import {
  AverageSongFeatures,
  Recommendations,
  Recommendation,
  Features,
} from './models';
@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css'],
})
export class RecommendationsComponent {
  constructor(
    private query: QueryService,
    private transfer: TransferDataService
  ) {}

  selectedPlaylist: any;
  songsRetrieved: number = 0;
  artistsRetrieved: number = 0;
  genresRetrieved: number = 0;
  previewUrl: string = '';
  playingTrack: string = '';
  @ViewChild('songPreview')
  songPreview!: ElementRef;

  tracks: string[] = [];
  averageFeatures: AverageSongFeatures = {
    acousticness: 0,
    danceability: 0,
    energy: 0,
    instrumentalness: 0,
    liveness: 0,
    loudness: 0,
    speechiness: 0,
    tempo: 0,
    valence: 0,
  };
  genres: {
    name: string;
    frequency: number;
  }[] = [];
  filteredGenres: string[] = [];

  recommendations: Recommendation[] = [];
  selectedTracks: string[] = [];

  async ngOnInit() {
    const data = this.transfer.getData();

    this.selectedPlaylist = data.selectedPlaylist;
    this.songsRetrieved = data.songsRetrieved;
    this.artistsRetrieved = data.artistsRetrieved;
    this.genresRetrieved = data.genresRetrieved;

    this.tracks = data.tracks;
    this.averageFeatures = data.averageFeatures;
    this.genres = data.genres;

    var seed_method = 'genres';

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
      var url = `https://api.spotify.com/v1/recommendations?seed_genres=${this.filteredGenres.join(
        ','
      )}&limit=100&target_acousticness=${
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
      recommendations = (await this.query.get(url)) as Recommendations;
    } else {
      var tracksTemp = this.tracks.slice(0, 5);
      var url = `https://api.spotify.com/v1/recommendations?seed_tracks=${tracksTemp.join(
        ','
      )}&limit=100&target_acousticness=${
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
      recommendations = (await this.query.get(url)) as Recommendations;
    }

    for (const track of recommendations.tracks) {
      if (!this.tracks.includes(track.id)) {
        // Compare song features with average song features
        var url = `https://api.spotify.com/v1/audio-features/${track.id}`;
        var audio_features = (await this.query.get(url)) as Features;
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

  onCheckboxChange(e: any, id: string) {
    if (e.target.checked) {
      this.selectedTracks.push(id);
    } else {
      this.selectedTracks = this.selectedTracks.filter((t) => t !== id);
    }
    console.log(this.selectedTracks);
  }

  previewHandler(url: string) {
    if (this.songPreview.nativeElement.src === url) url = '';

    this.songPreview.nativeElement.src = url;
    this.playingTrack = url;

    if (url) this.songPreview.nativeElement.play();
  }
}
