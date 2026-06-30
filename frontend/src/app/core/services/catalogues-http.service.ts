import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CatalogueModel } from '../models/catalogue.model';
import { ApiResponse } from '../models/api-response.interface';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CataloguesHttpService {
  private readonly http = inject(HttpClient);
  private readonly apiURL = `${environment.apiURL}/catalogues`;

  constructor() {}

  findAll(): Observable<ApiResponse<CatalogueModel[]>> {
    return this.http.get<ApiResponse<CatalogueModel[]>>(this.apiURL);
  }

}
