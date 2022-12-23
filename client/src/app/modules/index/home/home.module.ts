import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { NavComponent } from 'src/app/components/nav/nav.component';

@NgModule({
  declarations: [HomeComponent, NavComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: HomeComponent }]),
  ],
})
export class HomeModule {}
