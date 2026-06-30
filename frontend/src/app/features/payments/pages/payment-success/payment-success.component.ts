import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [Card, Button, RouterLink],
  template: `
    <div class="p-6 max-w-lg mx-auto text-center">
      <p-card>
        <div class="flex flex-col items-center gap-4 py-8">
          <i class="pi pi-check-circle text-6xl text-green-500"></i>
          <h2 class="text-3xl font-semibold">Payment Successful!</h2>
          <p class="text-surface-500">
            Thank you for your purchase. Your membership is now active.
          </p>
          <p-button label="Go to Dashboard" icon="pi pi-home" routerLink="/dashboard" />
        </div>
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentSuccessComponent {}
