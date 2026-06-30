import type {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  req = req.clone({ withCredentials: true });

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint =
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/logout');

      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      if (
        authService.authStatus() === 'not-authenticated' &&
        authService.user() === null
      ) {
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            refreshTokenSubject.next(true);
            return next(req);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            refreshTokenSubject.next(false);
            return throwError(() => refreshError);
          }),
          finalize(() => {
            isRefreshing = false;
          }),
        );
      }

      return refreshTokenSubject.pipe(
        filter((result) => result !== null),
        take(1),
        switchMap((success) => {
          if (success) {
            return next(req);
          } else {
            return throwError(() => new Error('Token refresh failed'));
          }
        }),
      );
    }),
  );
};
