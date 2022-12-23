import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ScanComponent } from './components/scan/scan.component';
import { NavComponent } from 'src/app/components/nav/nav.component';

@NgModule({
  declarations: [
    ScanComponent,
    NavComponent,
  ],
  imports: [
    RouterModule.forChild([ { path: '', component: ScanComponent } ]),
  ],
})
export class ScanModule {}
