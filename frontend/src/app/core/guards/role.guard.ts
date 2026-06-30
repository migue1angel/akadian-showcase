import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ROUTES } from '@shared/constants/routing.constants';
import { firstValueFrom } from 'rxjs';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    let user = authService.user();
    let authStatus = authService.authStatus();

    if (authStatus === 'checking' || !user) {
      const success = await firstValueFrom(authService.loadUserProfile());
      if (success) {
        user = authService.user();
        authStatus = authService.authStatus();
      }
    }

    if (!user || authStatus !== 'authenticated') {
      return router.createUrlTree([ROUTES.AUTH.LOGIN], {
        queryParams: { returnUrl: state.url },
      });
    }

    const userRoles = user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return router.createUrlTree([ROUTES.NOT_FOUND]);
    }

    return true;
  };
};
