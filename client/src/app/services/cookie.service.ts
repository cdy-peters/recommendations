import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CookieService {
  constructor() {}

  setCookie(name: string, value: string, seconds: number) {
    document.cookie = `${name}=${value}; Max-Age=${seconds}; path=/`;
  }

  getCookie(name: string) {
    let nameEQ = name + '=';
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  deleteCookie(name: string) {
    document.cookie = name + '=; Max-Age=-99999999;';
  }
}
