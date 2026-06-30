import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiResponse } from '@core/models/api-response.interface';
import { User } from '@core/models/user.model';
import { LoginResponse } from '@core/models/auth-response.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthHttpService {
  private readonly API_URL = `${environment.apiURL}/auth`;
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.API_URL}/login`,
      { email, password },
      { withCredentials: true },
    );
  }

  refreshToken(): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any>>(
        `${this.API_URL}/refresh`,
        {},
        { withCredentials: true },
      );
  }

  logout(): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any>>(
        `${this.API_URL}/logout`,
        {},
        { withCredentials: true },
      );
  }

  loadUserProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(
      `${this.API_URL}/me`,
      { withCredentials: true },
    );
  }
}
