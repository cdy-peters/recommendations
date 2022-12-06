import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { NavComponent } from './components/nav/nav.component';

import { AuthService } from './shared/services/auth.service';
import { CookieService } from './shared/services/cookie.service';
import { QueryService } from './shared/services/query.service';
import { TransferDataService } from './shared/services/transfer-data.service';

import { routeGuard } from './guards/route.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./modules/index/index.module').then((mod) => mod.IndexModule),
  },
  {
    path: 'scan',
    loadChildren: () =>
      import('./modules/scan/scan.module').then((m) => m.ScanModule),
    canActivate: [routeGuard],
  },
  {
    path: 'recommendations',
    loadChildren: () =>
      import('./modules/recommendations/recommendations.module').then(
        (m) => m.RecommendationsModule
      ),
    canActivate: [routeGuard],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [AppComponent, NavComponent],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes)],
  providers: [AuthService, CookieService, QueryService, TransferDataService],
  bootstrap: [AppComponent],
})
export class AppModule {}
