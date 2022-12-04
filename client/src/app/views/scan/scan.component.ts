import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { QueryService } from 'src/app/services/query.service';
import { TransferDataService } from 'src/app/services/transfer-data.service';

import { PlaylistItems, AverageSongFeatures, Features, Artist } from './models';

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

  selectedPlaylist: any;

  songsRetrieved: number = 0;
  artistsRetrieved: number = 0;
  genresRetrieved: number = 0;

  tracks: string[] = [];
  artists: {
    id: string;
    genres: string[];
  }[] = [];
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
  genres: {
    name: string;
    frequency: number;
  }[] = [];

  async ngOnInit() {
    this.selectedPlaylist = this.transfer.getData();
    const playlistId = this.selectedPlaylist.id;

    // Scan playlist for tracks and artists
    var url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    while (url) {
      var playlist = (await this.query.get(url)) as PlaylistItems;

      for (const item of playlist.items) {
        const track = item.track;
        const id = track.id;

        // Get track features
        var url = `https://api.spotify.com/v1/audio-features/${id}`;
        var features = (await this.query.get(url)) as Features;

        for (const key in this.average_song_features) {
          var val = <number>features[key as keyof Features];

          this.average_song_features[key as keyof AverageSongFeatures] += val;
        }

        this.tracks.push(id);
        this.songsRetrieved++;

        // Get unique artists and genres
        for (const artist of track.artists) {
          const id = artist.id;

          const index = this.artists.findIndex((artist) => artist.id == id);
          if (index == -1) {
            var url = `https://api.spotify.com/v1/artists/${artist.id}`;
            var artistInfo = (await this.query.get(url)) as Artist;
            var genres = artistInfo.genres;

            this.artists.push({ id, genres: genres });
            this.artistsRetrieved++;

            for (const genre of genres) {
              const index = this.genres.findIndex(
                (thisGenre) => thisGenre.name == genre
              );

              if (index == -1) {
                this.genres.push({ name: genre, frequency: 1 });
                this.genresRetrieved++;
              } else {
                this.genres[index].frequency++;
              }
            }
          } else {
            for (const genre of this.artists[index].genres) {
              const index = this.genres.findIndex(
                (thisGenre) => thisGenre.name == genre
              );

              if (index == -1) {
                this.genres.push({ name: genre, frequency: 1 });
              } else {
                this.genres[index].frequency++;
              }
            }
          }
        }
      }
      url = playlist.next;
    }
    // Average the song features
    for (const key in this.average_song_features) {
      this.average_song_features[key as keyof AverageSongFeatures] /=
        this.tracks.length;
    }

    // Navigate to recommendations page
    this.transfer.setData({
      tracks: this.tracks,
      average_song_features: this.average_song_features,
      genres: this.genres,
    });

    this.router.navigate(['/recommendations']);
  }
}
