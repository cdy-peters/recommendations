import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { NavComponent } from 'src/app/components/nav/nav.component';

import { RecommendationsService } from './services/recommendations.service';

@NgModule({
  declarations: [
    RecommendationsComponent,
    NavComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([ { path: '', component: RecommendationsComponent } ]),
  ],
  providers: [
    RecommendationsService,
  ],
})
export class RecommendationsModule {}
