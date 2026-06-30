import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@core/models/api-response.interface';
import { Unit } from 'src/app/features/programs/interfaces/unit.interface';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UnitsHttpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiURL}/units`;
  constructor() {}

  findOne(id: string): Observable<ApiResponse<Unit>> {
    return this.http
      .get<ApiResponse<Unit>>(`${this.apiUrl}/${id}`);
  }

  findByProgram(programId: string): Observable<ApiResponse<Unit[]>> {
    const url = `${this.apiUrl}/program/${programId}`;
    return this.http.get<ApiResponse<Unit[]>>(url);
  }
}
