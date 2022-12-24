import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavModule } from '../nav/nav.module';

import { ScanComponent } from './components/scan/scan.component';

@NgModule({
  declarations: [ScanComponent],
  imports: [
    NavModule,
    RouterModule.forChild([{ path: '', component: ScanComponent }]),
  ],
})
export class ScanModule {}
