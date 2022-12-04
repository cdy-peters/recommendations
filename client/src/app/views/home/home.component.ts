import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { CookieService } from 'src/app/services/cookie.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

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
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.cookieService.getCookie('access_token')}`,
    });
    var url = 'https://api.spotify.com/v1/me/playlists?limit=50';

    interface Response {
      items: any[];
      href: string;
      limit: number;
      next: string;
      offset: number;
      previous: string;
      total: number;
    }
    var res;
    do {
      res = (await this.http.get(url, { headers }).toPromise()) as Response;
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
    } while (res.next);
  }

  playlistSelectHandler(playlist: any) {
    this.selectedPlaylist = playlist;
  }
}
