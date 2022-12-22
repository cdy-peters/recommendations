import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { CookieService } from './cookie.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class QueryService {
  constructor(
    private http: HttpClient,
    private cookies: CookieService,
    private auth: AuthService
  ) {}

  async errorHandler(status: number) {
    switch (status) {
      // Invalid access token
      case 401:
        await this.auth.refreshToken();
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
      await this.errorHandler(err.status);
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
      await this.errorHandler(err.status);
      return await this.post(url, body);
    }
  }
}
