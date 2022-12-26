import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { CookieService } from './cookie.service';

@Injectable({
  providedIn: 'root',
})
export class QueryService {
  constructor(
    private http: HttpClient,
    private cookies: CookieService,
    private auth: AuthService
  ) {}

  async errorHandler(err: any) {
    switch (err.status) {
      // Invalid access token
      case 401:
        await this.auth.refreshToken();
        break;
      // Too many requests
      case 429:
        var retryAfter = err.headers.get('Retry-After');
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        break;
      default:
        console.error(err);
        break;
    }
  }

  // @ts-ignore
  async get(url: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.cookies.getCookie('access_token')}`,
    });

    try {
      const res = await lastValueFrom(this.http.get(url, { headers }));
      return res;
    } catch (err: any) {
      await this.errorHandler(err);
      return await this.get(url);
    }
  }

  // @ts-ignore
  async post(url: string, body: any) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.cookies.getCookie('access_token')}`,
    });

    try {
      const res = await lastValueFrom(this.http.post(url, body, { headers }));
      return res;
    } catch (err: any) {
      await this.errorHandler(err);
      return await this.post(url, body);
    }
  }
}
