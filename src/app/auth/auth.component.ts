import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { CookieService } from '../services/cookie.service';

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
    interface Response {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
    }

    var res: Response | undefined;
    var code = this.route.snapshot.queryParams['code'];

    // ! Refresh token is untested
    if (this.cookieService.getCookie('refresh_token')) {
      res = (await this.authService.refreshToken().toPromise()) as Response;
    } else if (code) {
      res = (await this.authService
        .getAccessToken(code)
        .toPromise()) as Response;
    }

    if (res) {
      document.cookie =
        'access_token=' +
        res.access_token +
        '; expires=' +
        new Date(Date.now() + res.expires_in * 1000).toUTCString() +
        '; path=/';
      document.cookie =
        'refresh_token=' +
        res.refresh_token +
        '; expires=' +
        new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toUTCString() +
        '; path=/';

      window.location.href = '/';
    }
  }
}
