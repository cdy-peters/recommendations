import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, ROUTES, Routes } from '@angular/router';

import { CookieService } from 'src/app/shared/services/cookie.service';

export const indexRoutes = (cookie: CookieService) => {
  var routes: Routes = [];

  if (cookie.isValid()) {
    routes = [
      {
        path: '',
        loadChildren: () =>
          import('./home/home.module').then((mod) => mod.HomeModule),
      },
    ];
  } else {
    routes = [
      {
        path: '',
        loadChildren: () =>
          import('./login/login.module').then((mod) => mod.LoginModule),
      },
    ];
  }

  return routes;
};

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule],
  providers: [
    {
      provide: ROUTES,
      useFactory: indexRoutes,
      deps: [CookieService],
    },
  ],
})
export class IndexModule {}
