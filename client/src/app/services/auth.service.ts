import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { CookieService } from './cookie.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

  client_id = 'b5bee82890774ce69535a3a2fd2caa86';
  redirect_uri = 'http://localhost:4200';
  server_url = 'http://localhost:8080';

  login() {
    var scope = 'user-read-private user-read-email';

    window.location.href =
      'https://accounts.spotify.com/authorize?client_id=' +
      this.client_id +
      '&response_type=code&redirect_uri=' +
      this.redirect_uri +
      '&scope=' +
      scope;
  }

  getAccessToken(code: string) {
    return this.http.get(this.server_url + '/getAccessToken', {
      params: {
        code: code,
      },
    });
  }

  refreshToken(cookie: string) {
    return this.http.get(this.server_url + '/refreshToken', {
      params: {
        refresh_token: cookie,
      },
    });
  }
}
