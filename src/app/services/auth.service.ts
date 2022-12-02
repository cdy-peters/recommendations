import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { CookieService } from './cookie.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

  client_id = '';
  client_secret = '';
  redirect_uri = 'http://localhost:4200';

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
    var grant_type = 'authorization_code';

    var headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(this.client_id + ':' + this.client_secret),
    });

    var body =
      'grant_type=' +
      grant_type +
      '&code=' +
      code +
      '&redirect_uri=' +
      this.redirect_uri;

    return this.http.post('https://accounts.spotify.com/api/token', body, {
      headers: headers,
    });
  }

  refreshToken() {
    var grant_type = 'refresh_token';

    var headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(this.client_id + ':' + this.client_secret),
    });

    var body =
      'grant_type=' +
      grant_type +
      '&refresh_token=' +
      this.cookieService.getCookie('refresh_token');

    return this.http.post('https://accounts.spotify.com/api/token', body, {
      headers: headers,
    });
  }
}
