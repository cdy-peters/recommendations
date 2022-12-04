import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    private route: ActivatedRoute,
    private query: QueryService,
    private router: Router,
    private transfer: TransferDataService
  ) {}

  tracks: string[] = [];
  artists: {
    id: string;
    frequency: number;
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
    const playlistId = this.route.snapshot.paramMap.get('playlistId');

    // Scan playlist for tracks and artists
    var url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    while (url) {
      var playlist = (await this.query.get(url)) as PlaylistItems;

      for (const item of playlist.items) {
        const track = item.track;
        const id = track.id;

        this.tracks.push(id);

        for (const artist of track.artists) {
          const id = artist.id;
          const index = this.artists.findIndex((artist) => artist.id == id);

          index == -1
            ? this.artists.push({ id, frequency: 1 })
            : this.artists[index].frequency++;
        }
      }
      url = playlist.next;
    }

    // Scan tracks for features
    for (const id of this.tracks) {
      var url = `https://api.spotify.com/v1/audio-features/${id}`;
      var features = (await this.query.get(url)) as Features;

      for (const key in this.average_song_features) {
        var val = <number>features[key as keyof Features];

        this.average_song_features[key as keyof AverageSongFeatures] += val;
      }
    }

    for (const key in this.average_song_features) {
      this.average_song_features[key as keyof AverageSongFeatures] /=
        this.tracks.length;
    }

    // Scan artists for genres
    for (const artist of this.artists) {
      var url = `https://api.spotify.com/v1/artists/${artist.id}`;
      var artistInfo = (await this.query.get(url)) as Artist;

      for (const genre of artistInfo.genres) {
        const index = this.genres.findIndex(
          (thisGenre) => thisGenre.name == genre
        );

        index == -1
          ? this.genres.push({ name: genre, frequency: artist.frequency })
          : (this.genres[index].frequency += artist.frequency);
      }
    }
    this.genres.sort((a, b) => b.frequency - a.frequency);

    var genresArr = [];
    for (const genre of this.genres) {
      genresArr.push(genre.name);
    }

    // Navigate to recommendations page
    this.transfer.setData({
      average_song_features: this.average_song_features,
      genres: genresArr,
    });

    this.router.navigate(['/recommendations']);
  }
}
