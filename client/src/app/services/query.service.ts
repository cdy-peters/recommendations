import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { CookieService } from './cookie.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QueryService {
  constructor(private http: HttpClient, private cookies: CookieService) { }

  async get(url: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.cookies.getCookie('access_token')}`
    });

    return await lastValueFrom(this.http.get(url, { headers }));
  }
}
