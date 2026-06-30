import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ROUTES } from '@shared/constants/routing.constants';
import { firstValueFrom } from 'rxjs';

export const blockLoginGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  if (authStatus === 'checking') {
    const success = await firstValueFrom(authService.loadUserProfile());
    if (success) {
      return router.createUrlTree([ROUTES.ROOT]);
    }
    return true;
  }

  if (authStatus === 'authenticated') {
    return router.createUrlTree([ROUTES.ROOT]);
  }

  return true;
};