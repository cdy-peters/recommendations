import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor() {}

  logout() {
    document.cookie =
      'access_token = ; expires = Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie =
      'refresh_token = ; expires = Thu, 01 Jan 1970 00:00:00 GMT; path=/';

    window.location.href = '/';
  }
}
