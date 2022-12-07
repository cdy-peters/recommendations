import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, ROUTES, Routes } from '@angular/router';

import { AuthService } from 'src/app/shared/services/auth.service';

export const indexRoutes = (auth: AuthService) => {
  var routes: Routes = [];

  if (auth.isAuthenticated()) {
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
      deps: [AuthService],
    },
  ],
})
export class IndexModule {}
