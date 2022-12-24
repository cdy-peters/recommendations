import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavModule } from '../nav/nav.module';

import { RecommendationsComponent } from './components/recommendations/recommendations.component';

import { RecommendationsService } from './services/recommendations.service';

@NgModule({
  declarations: [RecommendationsComponent],
  imports: [
    CommonModule,
    NavModule,
    RouterModule.forChild([{ path: '', component: RecommendationsComponent }]),
  ],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
