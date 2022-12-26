import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { QueryService } from 'src/app/shared/services/query.service';
import { TransferDataService } from 'src/app/shared/services/transfer-data.service';

import { AverageSongFeatures } from 'src/app/shared/models/models';
import {
  ArtistResponse,
  FeaturesResponse,
  PlaylistItemsResponse
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

  skip: boolean = false;
  trackErrors: number = 0;

  async ngOnInit() {
    // Get tracks (audio features), artists and genres
    var url = `https://api.spotify.com/v1/playlists/${this.selectedPlaylist.id}/tracks?limit=50`;

    while (url && !this.skip) {
      var playlist = <PlaylistItemsResponse>await this.query.get(url);

      // Get tracks
      var ids = playlist.items.map((i) => i.track.id);
      await this.getTracks(ids);

      // Get artists and genres
      var artists = playlist.items.map((i) => i.track.artists);
      await this.getGenres(artists);

      url = playlist.next;
    }

    // Average the song features
    for (const key in this.averageFeatures) {
      var val = <number>this.averageFeatures[<keyof AverageSongFeatures>key];
      val /= this.tracks.length - this.trackErrors;

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

  async getTracks(ids: string[]) {
    var url = `https://api.spotify.com/v1/audio-features?ids=${ids.join(',')}`;
    var audioFeatures = <any>await this.query.get(url);

    audioFeatures = <FeaturesResponse[]>audioFeatures.audio_features;

    for (var i = 0; i < audioFeatures.length; i++) {
      // Check if track has audio features
      if (audioFeatures[i]) {
        for (const key in this.averageFeatures) {
          var val = <number>audioFeatures[i][<keyof AverageSongFeatures>key];

          this.averageFeatures[<keyof AverageSongFeatures>key] += val;
        }
      } else {
        this.trackErrors++;
      }

      this.tracks.push(ids[i]);
    }
  }

  async getGenres(artists: any[]) {
    var ids: { id: string; frequency: number }[] = [];

    // Get ids of artists
    for (const trackArtists of artists) {
      for (const artist of trackArtists) {
        const id = artist.id;

        // Check if artist has already been added
        const index = this.artists.findIndex((a) => a.id == id);
        if (index != -1) {
          var genres = this.artists[index].genres;

          for (const genre of genres) {
            const index = this.genres.findIndex((g) => g.genre == genre);
            this.genres[index].frequency++;
          }
        } else {
          const index = ids.findIndex((i) => i.id == id);

          index === -1
            ? ids.push({ id, frequency: 1 })
            : ids[index].frequency++;
        }
      }
    }

    // Get genres of artists that have not been added already
    if (ids.length) {
      var idsQuery = ids.map((id) => id.id);

      while (idsQuery.length) {
        var url = `https://api.spotify.com/v1/artists?ids=${idsQuery
          .splice(0, 50)
          .join(',')}`;
        var artistInfo = <any>await this.query.get(url);
        artistInfo = <ArtistResponse[]>artistInfo.artists;

        for (const artist of artistInfo) {
          const id = artist.id;
          const genres = artist.genres;

          this.artists.push({ id, genres });

          for (const genre of genres) {
            const index = this.genres.findIndex((g) => g.genre == genre);

            index == -1
              ? this.genres.push({ genre, frequency: 1 })
              : this.genres[index].frequency++;
          }
        }
      }
    }
  }
}
