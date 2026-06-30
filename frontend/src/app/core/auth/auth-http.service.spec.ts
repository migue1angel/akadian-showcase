import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi, } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, } from '@angular/common/http/testing';
import { AuthHttpService } from './auth-http.service';
import { ApiResponse } from '@core/models/api-response.interface';
import { User } from '@core/models/user.model';
import { LoginResponse } from '@core/models/auth-response.interface';
import { environment } from 'src/environments/environment';

const API_URL = `${environment.apiURL}/auth`;

describe('AuthHttpService', () => {
    let service: AuthHttpService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AuthHttpService,
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(AuthHttpService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('login', () => {
        it('should POST to /auth/login with credentials and withCredentials option', () => {
            const mockResponse: LoginResponse = {
                requires2FA: false,
                message: 'Login successful',
            };

            service.login('test@test.com', '123456').subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpTestingController.expectOne(`${API_URL}/login`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                email: 'test@test.com',
                password: '123456',
            });
            expect(req.request.withCredentials).toBe(true);
            req.flush(mockResponse);
        });
    });

    describe('refreshToken', () => {
        it('should POST to /auth/refresh with empty body and withCredentials option', () => {
            const mockResponse: ApiResponse<any> = {
                data: null,
                message: 'Token refreshed',
            };

            service.refreshToken().subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpTestingController.expectOne(`${API_URL}/refresh`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({});
            expect(req.request.withCredentials).toBe(true);
            req.flush(mockResponse);
        });
    });

    describe('logout', () => {
        it('should POST to /auth/logout with empty body and withCredentials option', () => {
            const mockResponse: ApiResponse<any> = {
                data: null,
                message: 'Logged out',
            };

            service.logout().subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpTestingController.expectOne(`${API_URL}/logout`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({});
            expect(req.request.withCredentials).toBe(true);
            req.flush(mockResponse);
        });
    });

    describe('loadUserProfile', () => {
        it('should GET /auth/me with withCredentials option', () => {
            const mockUser: User = {
                id: '1',
                email: 'test@test.com',
                firstName: 'John',
                lastName: 'Doe',
                isActive: true,
                emailVerified: true,
                roles: ['user'],
            };
            const mockResponse: ApiResponse<User> = {
                data: mockUser,
                message: 'User profile loaded',
            };

            service.loadUserProfile().subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpTestingController.expectOne(`${API_URL}/me`);
            expect(req.request.method).toBe('GET');
            expect(req.request.withCredentials).toBe(true);
            req.flush(mockResponse);
        });
    });
});
