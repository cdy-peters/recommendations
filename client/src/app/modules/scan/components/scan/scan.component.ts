import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { QueryService } from 'src/app/shared/services/query.service';
import { TransferDataService } from 'src/app/shared/services/transfer-data.service';

import { AverageSongFeatures } from 'src/app/shared/models/models';
import {
  ArtistResponse,
  FeaturesResponse,
  PlaylistItemsResponse,
} from 'src/app/shared/models/spotify-models';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.css'],
})
export class ScanComponent {
  constructor(
    private query: QueryService,
    private router: Router,
    private transfer: TransferDataService
  ) {}

  selectedPlaylist: any = this.transfer.getData();

  tracks: string[] = [];
  averageFeatures: AverageSongFeatures = new AverageSongFeatures();
  artists: {
    id: string;
    genres: string[];
  }[] = [];
  genres: {
    genre: string;
    frequency: number;
  }[] = [];

  async ngOnInit() {
    // Get tracks (audio features), artists and genres
    var url = `https://api.spotify.com/v1/playlists/${this.selectedPlaylist.id}/tracks`;
    while (url) {
      var playlist = <PlaylistItemsResponse>await this.query.get(url);

      for (const item of playlist.items) {
        const track = item.track;

        await this.getTracks(track.id);
        for (const artist of track.artists) await this.getGenres(artist.id);
      }

      url = playlist.next;
    }

    // Average the song features
    for (const key in this.averageFeatures) {
      var val = <number>this.averageFeatures[<keyof AverageSongFeatures>key];
      val /= this.tracks.length;

      this.averageFeatures[<keyof AverageSongFeatures>key] = +val.toFixed(5);
    }

    // Navigate to recommendations page
    this.transfer.setData({
      selectedPlaylist: this.selectedPlaylist,
      averageFeatures: this.averageFeatures,
      tracks: this.tracks,
      genres: this.genres,
      artists: this.artists,
    });

    this.router.navigate(['/recommendations']);
  }

  async getTracks(id: string) {
    var url = `https://api.spotify.com/v1/audio-features/${id}`;
    var features = <FeaturesResponse>await this.query.get(url);

    for (const key in this.averageFeatures) {
      var val = <number>features[<keyof AverageSongFeatures>key];

      this.averageFeatures[<keyof AverageSongFeatures>key] += val;
    }

    this.tracks.push(id);
  }

  async getGenres(id: string) {
    const index = this.artists.findIndex((a) => a.id == id);

    if (index == -1) {
      var url = `https://api.spotify.com/v1/artists/${id}`;
      var artistInfo = <ArtistResponse>await this.query.get(url);
      var genres = artistInfo.genres;

      this.artists.push({ id, genres });

      for (const genre of genres) {
        const index = this.genres.findIndex((g) => g.genre == genre);

        index == -1
          ? this.genres.push({ genre, frequency: 1 })
          : this.genres[index].frequency++;
      }
    } else {
      var genres = this.artists[index].genres;

      for (const genre of genres) {
        const index = this.genres.findIndex((g) => g.genre == genre);
        this.genres[index].frequency++;
      }
    }
  }
}
