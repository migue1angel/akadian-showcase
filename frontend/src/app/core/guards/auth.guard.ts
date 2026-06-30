import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ROUTES } from '@shared/constants/routing.constants';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  if (authStatus === 'authenticated') {
    return true;
  }

  const success = await firstValueFrom(authService.loadUserProfile());

  if (success) {
    return true;
  }

  return router.createUrlTree([ROUTES.AUTH.LOGIN], {
    queryParams: { returnUrl: state.url },
  });
};
