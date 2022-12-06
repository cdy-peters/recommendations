import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

import { TransferDataService } from '../shared/services/transfer-data.service';

export const routeGuard: CanActivateFn = () => {
  const router = inject(Router);
  const transfer = inject(TransferDataService);

  if (transfer.checkData()) {
    return true;
  }

  return router.navigate(['/']);
};
