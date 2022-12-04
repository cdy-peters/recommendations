import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { QueryService } from 'src/app/services/query.service';

import { PlaylistItems } from './models';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.css'],
})
export class ScanComponent {
  constructor(private route: ActivatedRoute, private query: QueryService) {}

  tracks: string[] = [];
  artists: {
    name: string;
    frequency: number;
  }[] = [];

  async ngOnInit() {
    const playlistId = this.route.snapshot.paramMap.get('playlistId');

    var url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    while (url) {
      var res = (await this.query.get(url)) as PlaylistItems;

      for (const item of res.items) {
        const track = item.track;
        const id = track.id;

        this.tracks.push(id);

        for (const artist of track.artists) {
          const name = artist.name;
          const index = this.artists.findIndex((artist) => artist.name == name);

          index == -1
            ? this.artists.push({ name, frequency: 1 })
            : this.artists[index].frequency++;
        }
      }
      url = res.next;
    }
  }
}
