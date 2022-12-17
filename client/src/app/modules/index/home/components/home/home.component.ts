import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from 'src/app/shared/services/auth.service';
import { CookieService } from 'src/app/shared/services/cookie.service';
import { QueryService } from 'src/app/shared/services/query.service';
import { TransferDataService } from 'src/app/shared/services/transfer-data.service';

import {
  PlaylistsResponse,
  UserResponse,
} from 'src/app/shared/models/spotify-models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private query: QueryService,
    private transfer: TransferDataService,
    private cookie: CookieService,
    private auth: AuthService
  ) {}

  selectedPlaylist: any;
  playlists: any[] = [];
  filteredPlaylists: any[] = [];

  searchTerm: string = '';
  loading: boolean = true;

  filterPlaylists() {
    this.filteredPlaylists = this.playlists.filter((playlist) =>
      playlist.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  async ngOnInit() {
    // Set access token on auth redirect
    if (this.router.url.split('?')[0] == '/callback') {
      var code = this.route.snapshot.queryParams['code'];
      history.replaceState(null, '', '/');

      if (code) {
        await this.auth.getAccessToken(code);

        // Get user id
        var user = <UserResponse>(
          await this.query.get('https://api.spotify.com/v1/me')
        );
        localStorage.setItem('userId', user.id);
      } else {
        this.router.navigate(['/']);
      }
    }

    // Wait for access token to be refreshed
    while (!this.cookie.getCookie('access_token')) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

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
    this.loading = false;
  }

  selectPlaylistHandler(playlist: any) {
    this.selectedPlaylist = playlist;

    setTitleMarquee('#selected_name > h5', playlist.name, 200);
  }

  scanPlaylistHandler() {
    this.transfer.setData(this.selectedPlaylist);

    this.router.navigate(['/scan']);
  }
}
