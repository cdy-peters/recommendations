export class CookieService {
  setCookie(key: string, value: string, seconds: number) {
    document.cookie = `${key}=${value}; Max-Age=${seconds}; path=/`;
  }

  getCookie(key: string) {
    key = key + '=';
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      var c = cookies[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(key) == 0) return c.substring(key.length, c.length);
    }
    return null;
  }

  deleteCookie(key: string) {
    document.cookie = key + '=; Max-Age=-99999999;';
  }
}
