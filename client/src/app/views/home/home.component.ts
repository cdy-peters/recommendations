import { Component } from '@angular/core';

import { QueryService } from 'src/app/services/query.service';

import { Playlists } from './models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(private query: QueryService) { }

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
      var res = (await this.query.get(url)) as Playlists;

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

  playlistSelectHandler(playlist: any) {
    this.selectedPlaylist = playlist;
  }
}
