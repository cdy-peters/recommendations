import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from './services/auth.service';
import { CookieService } from 'src/app/services/cookie.service';

export interface Response {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
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
    private cookieService: CookieService
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

      window.location.href = '/';
    }
  }
}
