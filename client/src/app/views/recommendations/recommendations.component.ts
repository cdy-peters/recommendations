import { Component } from '@angular/core';

import { TransferDataService } from 'src/app/services/transfer-data.service';

import { AverageSongFeatures } from './models';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css'],
})
export class RecommendationsComponent {
  constructor(private transfer: TransferDataService) {}

  average_song_features: AverageSongFeatures = {
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
  genres: string[] = [];

  async ngOnInit() {
    const data = this.transfer.getData();

    this.average_song_features = data.average_song_features;
    this.genres = data.genres;
  }
}
