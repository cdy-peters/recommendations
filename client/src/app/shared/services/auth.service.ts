import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { CookieService } from './cookie.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private cookie: CookieService) {}

  client_id = 'b5bee82890774ce69535a3a2fd2caa86';
  redirect_uri = 'http://localhost:4200';
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

  isAuthenticated() {
    var access_token = this.cookie.getCookie('access_token');
    if (access_token) {
      return true;
    }

    var refresh_token = this.cookie.getCookie('refresh_token');
    if (refresh_token) {
      this.refreshToken(refresh_token);
      return true;
    }

    return false;
  }

  getAccessToken(code: string) {
    return this.http.get(this.server_url + '/getAccessToken', {
      params: {
        code: code,
      },
    });
  }

  async refreshToken(refresh_token: string) {
    var res = <TokenResponse>await lastValueFrom(
      this.http.get(this.server_url + '/refreshToken', {
        params: {
          refresh_token,
        },
      })
    );

    this.cookie.setCookie('access_token', res.access_token, res.expires_in);
    if (res.refresh_token) {
      this.cookie.setCookie('refresh_token', res.refresh_token, 604800);
    }
  }
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}
