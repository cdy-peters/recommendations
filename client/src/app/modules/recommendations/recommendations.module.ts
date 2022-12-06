import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { RecommendationsComponent } from './components/recommendations/recommendations.component';


@NgModule({
  declarations: [
    RecommendationsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([ { path: '', component: RecommendationsComponent } ]),
  ],
})
export class RecommendationsModule {}
