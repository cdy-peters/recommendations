import { Component } from '@angular/core';

import { CookieService } from '../services/cookie.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent {
  constructor(private cookieService: CookieService) {}

  signout() {
    this.cookieService.deleteCookie('access_token');
    this.cookieService.deleteCookie('refresh_token');
    window.location.href = '/';
  }
}
