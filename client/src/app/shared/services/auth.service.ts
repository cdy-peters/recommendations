import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  client_id = 'b5bee82890774ce69535a3a2fd2caa86';
  redirect_uri = 'http://localhost:4200/login';
  server_url = 'http://localhost:8080';

  login() {
    var scope =
      'user-read-private user-read-email user-library-read playlist-read-private playlist-modify-public playlist-modify-private';

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
