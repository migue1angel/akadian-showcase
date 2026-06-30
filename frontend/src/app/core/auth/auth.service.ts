import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthHttpService } from './auth-http.service';
import { ApiResponse } from '@core/models/api-response.interface';
import { User } from '@core/models/user.model';
import { LoginResponse } from '@core/models/auth-response.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { LoadingService } from '@core/services/ui/loading.service';

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authHttp = inject(AuthHttpService);
  private readonly router = inject(Router);
  private readonly loadingService = inject(LoadingService);

  private readonly _authStatus = signal<AuthStatus>('checking');
  private readonly _user = signal<User | null>(null);

  public authStatus = computed(() => {
    if (this._authStatus() === 'checking') return 'checking';
    if (this._user()) return 'authenticated';
    return 'not-authenticated';
  });
  public user = computed(() => this._user());

  login(email: string, password: string): Observable<LoginResponse> {
    return this.authHttp.login(email, password);
  }

  refreshToken(): Observable<boolean> {
    return this.authHttp.refreshToken()
      .pipe(
        switchMap(() => this.loadUserProfile()),
        catchError((error) => {
          if (error?.status === 401) {
            this.clearAuthState();
          }
          throw error;
        }),
      );
  }

  logout(): Observable<ApiResponse<any>> {
    return this.authHttp.logout()
      .pipe(
        tap(() => {
          this.clearAuthState();
          this.router.navigate(['/auth/login']).then(() => {
            this.loadingService.hideSpinner();
          });
        }),
        catchError((error) => {
          console.error('Logout failed - session still active on server', error);
          return throwError(() => error);
        }),
      );
  }

  clearAuthState(): void {
    this._user.set(null);
    this._authStatus.set('not-authenticated');
  }

  loadUserProfile(): Observable<boolean> {
    if (this._authStatus() === 'authenticated' && this._user()) {
      return of(true);
    }

    this._authStatus.set('checking');

    return this.authHttp.loadUserProfile().pipe(
      map((response) => this.handleAuthSuccess(response.data)),
      catchError(() => {
        this.clearAuthState();
        return of(false);
      }),
    );
  }

  loadUserProfileResource = rxResource({
    stream: () => this.loadUserProfile(),
  });

  refreshUserProfile(): void {
    this.loadUserProfileResource.reload();
  }

  private handleAuthSuccess(user: User): boolean {
    this._user.set(user);
    this._authStatus.set('authenticated');
    return true;
  }
}
