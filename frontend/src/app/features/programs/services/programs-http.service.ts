import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ApiResponse } from '@core/models/api-response.interface';
import { Program } from 'src/app/features/programs/interfaces/program.interface';
import { map, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProgramItem } from '../interfaces/program-item.interface';

@Injectable({
  providedIn: 'root',
})
export class ProgramsHttpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiURL}/programs`;

  readonly selectedProgramId = signal<string | undefined>(undefined);

  readonly programsListResource = rxResource({
    stream: () => this.findAllList(),
  });

  readonly programResource = rxResource({
    params: this.selectedProgramId,
    stream: ({ params: id }) => {
      if (!id) return of(null);
      return this.findOne(id).pipe(map((response) => response.data));
    },
    defaultValue: null,
  });

  createProgram(program: Program): Observable<ApiResponse<Program>> {
    return this.http.post<ApiResponse<Program>>(this.apiUrl, program);
  }

  findAllList(): Observable<ApiResponse<ProgramItem[]>> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((response) => {
        const items = response.data || [];
        return {
          success: response.success,
          data: items.map((item: any) => ({
            id: item.id,
            name: item.name,
            totalClasses: 4,
            totalUnits: item.totalUnits,
            level: item.levelId === '00000000-0000-0000-0000-000000000002' ? 'A1 Beginner' : 'B1 Intermediate',
            isActive: item.isActive,
          })),
          message: response.message,
        };
      })
    );
  }

  findOne(id: string): Observable<ApiResponse<Program>> {
    return this.http.get<ApiResponse<Program>>(`${this.apiUrl}/${id}`);
  }

  update(id: string, program: Program): Observable<ApiResponse<Program>> {
    return this.http.patch<ApiResponse<Program>>(
      `${this.apiUrl}/${id}`,
      program
    );
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  reloadProgramsList(): void {
    this.programsListResource.reload();
  }

  loadProgram(id: string): void {
    this.selectedProgramId.set(id);
  }
}
