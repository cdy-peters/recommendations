import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { QueryService } from 'src/app/shared/services/query.service';
import { TransferDataService } from 'src/app/shared/services/transfer-data.service';

import { PlaylistsResponse } from 'src/app/shared/models/spotify-models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(private router: Router, private query: QueryService, private transfer: TransferDataService) { }

  selectedPlaylist: any;
  playlists: any[] = [];
  filteredPlaylists: any[] = [];

  searchTerm: string = '';

  filterPlaylists() {
    this.filteredPlaylists = this.playlists.filter((playlist) =>
      playlist.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  async ngOnInit() {
    var url = 'https://api.spotify.com/v1/me/playlists?limit=50';

    while (url) {
      var res = <PlaylistsResponse>await this.query.get(url);

      for (const item of res.items) {
        var id = item.id;
        var name = item.name;
        var tracks = item.tracks.total;
        if (tracks == 0) continue;
        var cover = item.images[0].url;

        this.playlists.push({ id, name, tracks, cover });
        this.filteredPlaylists.push({ id, name, tracks, cover });
      }
      url = res.next;
    }
  }

  selectPlaylistHandler(playlist: any) {
    this.selectedPlaylist = playlist;

    setMarquee("#selected_name > h5", playlist.name, 200);
  }

  scanPlaylistHandler() {
    this.transfer.setData(this.selectedPlaylist);

    this.router.navigate(['/scan']);
  }
}
