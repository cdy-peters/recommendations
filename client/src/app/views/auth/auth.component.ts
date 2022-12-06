import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from './services/auth.service';
import { CookieService } from 'src/app/services/cookie.service';
import { QueryService } from 'src/app/services/query.service';

export interface Response {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface User {
  country: string;
  display_name: string;
  email: string;
  external_urls: any;
  followers: any;
  href: string;
  id: string;
  images: any[];
  product: string;
  type: string;
  uri: string;
}

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private cookieService: CookieService,
    private query: QueryService
  ) {}

  login() {
    this.authService.login();
  }

  async ngOnInit() {
    var res: Response | undefined;
    var cookie = this.cookieService.getCookie('refresh_token');
    var code = this.route.snapshot.queryParams['code'];

    // ! Refresh token is untested
    if (cookie) {
      res = (await this.authService
        .refreshToken(cookie)
        .toPromise()) as Response;
    } else if (code) {
      res = (await this.authService
        .getAccessToken(code)
        .toPromise()) as Response;
    }

    if (res) {
      this.cookieService.setCookie(
        'access_token',
        res.access_token,
        res.expires_in
      );
      this.cookieService.setCookie('refresh_token', res.refresh_token, 604800);

      var user = (await this.query.get(
        'https://api.spotify.com/v1/me'
      )) as User;
      localStorage.setItem('userId', user.id);

      window.location.href = '/';
    }
  }
}
