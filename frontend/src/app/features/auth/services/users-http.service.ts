import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@core/models/user.model';
import { ApiResponse } from '@core/models/api-response.interface';
import { environment } from 'src/environments/environment';

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersHttpService {
  private readonly http = inject(HttpClient);
  private readonly apiURL = environment.apiURL;

  updateProfile(dto: UpdateProfileDto): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(
      `${this.apiURL}/users/profile`,
      dto,
    );
  }
}
