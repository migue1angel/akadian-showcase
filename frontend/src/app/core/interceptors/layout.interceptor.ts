import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '@core/services/ui/loading.service';
import { finalize } from 'rxjs';

export const layoutInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  const skipLoading = req.headers.has('X-Skip-Loading');

  if (skipLoading) {
    return next(req);
  }

  loadingService.startRequest();

  return next(req).pipe(
    finalize(() => loadingService.endRequest()),
  );
};
