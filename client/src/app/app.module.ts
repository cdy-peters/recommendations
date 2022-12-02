import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';

const authRequired = () => {
  const getCookie = (name: string) => {
    let nameEQ = name + '=';
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  if (getCookie('access_token')) {
    return HomeComponent;
  } else {
    return AuthComponent;
  }
};

@NgModule({
  declarations: [AppComponent, HomeComponent, AuthComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot([{ path: '', component: authRequired() }]),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
