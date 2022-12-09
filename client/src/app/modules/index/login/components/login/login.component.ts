import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from 'src/app/shared/services/auth.service';
import { QueryService } from 'src/app/shared/services/query.service';

import { User } from 'src/app/shared/models/models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private query: QueryService
  ) {}

  login = () => this.auth.login();

  async ngOnInit() {
    var code = this.route.snapshot.queryParams['code'];

    if (code) {
      await this.auth.getAccessToken(code);

      var user = <User>await this.query.get('https://api.spotify.com/v1/me');
      localStorage.setItem('userId', user.id);

      window.location.href = '/';
    }
  }
}
