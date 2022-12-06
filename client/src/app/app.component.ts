import { Component } from '@angular/core';

import { CookieService } from './shared/services/cookie.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'recommendations';

  constructor(private cookieService: CookieService) {}

  authenticated = false;

  ngOnInit() {
    this.cookieService.getCookie('access_token')
      ? (this.authenticated = true)
      : (this.authenticated = false);
  }
}
