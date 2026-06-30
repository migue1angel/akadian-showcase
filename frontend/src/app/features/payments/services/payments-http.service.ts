import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiResponse } from '@core/models/api-response.interface';

export interface StripeSessionResponse {
  url: string;
  sessionId: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentsHttpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiURL}/payments`;

  createCheckoutSession(priceId: string): Observable<ApiResponse<StripeSessionResponse>> {
    return this.http.post<ApiResponse<StripeSessionResponse>>(
      `${this.apiUrl}/checkout-session`,
      { priceId },
    );
  }
}
