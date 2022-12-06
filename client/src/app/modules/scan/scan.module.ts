import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ScanComponent } from './components/scan/scan.component';

@NgModule({
  declarations: [
    ScanComponent,
  ],
  imports: [
    RouterModule.forChild([ { path: '', component: ScanComponent } ]),
  ],
})
export class ScanModule {}
