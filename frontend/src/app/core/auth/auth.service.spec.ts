import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthHttpService } from './auth-http.service';
import { Router } from '@angular/router';
import { LoadingService } from '@core/services/ui/loading.service';
import { User } from '@core/models/user.model';

const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    emailVerified: true,
    roles: ['user'],
};

describe('AuthService', () => {
    let service: AuthService;
    let authHttpSpy: { login: any; refreshToken: any; logout: any; loadUserProfile: any };
    let routerSpy: { navigate: any };
    let loadingService: LoadingService;

    beforeEach(() => {
        authHttpSpy = {
            login: vi.fn().mockName("AuthHttpService.login"),
            refreshToken: vi.fn().mockName("AuthHttpService.refreshToken"),
            logout: vi.fn().mockName("AuthHttpService.logout"),
            loadUserProfile: vi.fn().mockName("AuthHttpService.loadUserProfile")
        };

        routerSpy = {
            navigate: vi.fn().mockName("Router.navigate")
        };

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                LoadingService,
                { provide: AuthHttpService, useValue: authHttpSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });

        service = TestBed.inject(AuthService);
        loadingService = TestBed.inject(LoadingService);
    });

    describe('initial state', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should start with checking status and null user', () => {
            expect(service.authStatus()).toBe('checking');
            expect(service.user()).toBeNull();
        });
    });

    describe('login', () => {
        it('should delegate to authHttp.login', () => {
            const email = 'test@test.com';
            const password = 'pass123';
            authHttpSpy.login.mockReturnValue(of({} as any));

            service.login(email, password).subscribe();

            expect(authHttpSpy.login).toHaveBeenCalledWith(email, password);
        });
    });

    describe('refreshToken', () => {
        it('should set user and status to authenticated on success', async () => {
            authHttpSpy.refreshToken.mockReturnValue(of({ data: null, message: 'ok' }));
            authHttpSpy.loadUserProfile.mockReturnValue(of({ data: mockUser, message: 'ok' }));

            const result = await firstValueFrom(service.refreshToken());

            expect(result).toBe(true);
            expect(service.user()).toEqual(mockUser);
            expect(service.authStatus()).toBe('authenticated');
            expect(authHttpSpy.loadUserProfile).toHaveBeenCalledOnce();
        });

        it('should clear auth state on 401 error', () => {
            authHttpSpy.refreshToken.mockReturnValue(throwError(() => ({ status: 401 })));

            service.refreshToken().subscribe({ error: () => { } });

            expect(service.authStatus()).toBe('not-authenticated');
            expect(service.user()).toBeNull();
        });

        it('should rethrow non-401 error', () => {
            const testError = { status: 500 };
            authHttpSpy.refreshToken.mockReturnValue(throwError(() => testError));

            let capturedError: any;
            service.refreshToken().subscribe({
                error: (e) => {
                    capturedError = e;
                },
            });

            expect(capturedError).toBe(testError);
            expect(service.authStatus()).toBe('checking');
        });
    });

    describe('logout', () => {
        it('should clear auth state and navigate on success', async () => {
            authHttpSpy.logout.mockReturnValue(of({ data: null, message: 'ok' }));
            routerSpy.navigate.mockReturnValue(Promise.resolve(true));
            vi.spyOn(loadingService, 'hideSpinner');

            await firstValueFrom(service.logout());

            expect(service.user()).toBeNull();
            expect(service.authStatus()).toBe('not-authenticated');
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
            expect(loadingService.hideSpinner).toHaveBeenCalled();
        });

        it('should log and rethrow on error', () => {
            const error = new Error('fail');
            authHttpSpy.logout.mockReturnValue(throwError(() => error));
            vi.spyOn(console, 'error');

            let capturedError: any;
            service.logout().subscribe({
                error: (e) => {
                    capturedError = e;
                },
            });

            expect(capturedError).toBe(error);
            expect(console.error).toHaveBeenCalledWith('Logout failed - session still active on server', error);
        });
    });

    describe('clearAuthState', () => {
        it('should reset user and status', () => {
            (service as any)._authStatus.set('authenticated');
            (service as any)._user.set(mockUser);

            service.clearAuthState();

            expect(service.user()).toBeNull();
            expect(service.authStatus()).toBe('not-authenticated');
        });
    });

    describe('loadUserProfile', () => {
        it('should return of(true) when already authenticated', () => {
            (service as any)._authStatus.set('authenticated');
            (service as any)._user.set(mockUser);

            let result: boolean | undefined;
            service.loadUserProfile().subscribe((r) => (result = r));

            expect(result).toBe(true);
            expect(authHttpSpy.loadUserProfile).not.toHaveBeenCalled();
        });

        it('should set user and status on success', () => {
            authHttpSpy.loadUserProfile.mockReturnValue(of({ data: mockUser, message: 'ok' }));

            let result: boolean | undefined;
            service.loadUserProfile().subscribe((r) => (result = r));

            expect(result).toBe(true);
            expect(service.user()).toEqual(mockUser);
            expect(service.authStatus()).toBe('authenticated');
        });

        it('should clear state and return false on error', () => {
            authHttpSpy.loadUserProfile.mockReturnValue(throwError(() => new Error('fail')));

            let result: boolean | undefined;
            service.loadUserProfile().subscribe((r) => (result = r));

            expect(result).toBe(false);
            expect(service.authStatus()).toBe('not-authenticated');
            expect(service.user()).toBeNull();
        });
    });

    describe('refreshUserProfile', () => {
        it('should trigger reload', () => {
            vi.spyOn(service.loadUserProfileResource, 'reload');
            service.refreshUserProfile();
            expect(service.loadUserProfileResource.reload).toHaveBeenCalledTimes(1);
            expect(service.loadUserProfileResource.reload).toHaveBeenCalledWith();
        });
    });
});
