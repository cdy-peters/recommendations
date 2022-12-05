import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HomeComponent } from './views/home/home.component';
import { AuthComponent } from './views/auth/auth.component';
import { NavComponent } from './views/partials/nav/nav.component';
import { ScanComponent } from './views/scan/scan.component';
import { RecommendationsComponent } from './views/recommendations/recommendations.component';

import { CookieService } from './services/cookie.service';
import { QueryService } from './services/query.service';
import { TransferDataService } from './services/transfer-data.service';

import { routeGuard } from './auth/route.guard';

const routes: Routes = [
  {
    path: '',
    component: new CookieService().isValid() ? HomeComponent : AuthComponent,
  },
  { path: 'scan', component: ScanComponent, canActivate: [routeGuard] },
  {
    path: 'recommendations',
    component: RecommendationsComponent,
    canActivate: [routeGuard],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AuthComponent,
    NavComponent,
    ScanComponent,
    RecommendationsComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    FormsModule,
  ],
  providers: [CookieService, QueryService, TransferDataService],
  bootstrap: [AppComponent],
})
export class AppModule {}
