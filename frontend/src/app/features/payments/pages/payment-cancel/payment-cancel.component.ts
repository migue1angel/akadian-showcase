import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [Card, Button, RouterLink],
  template: `
    <div class="p-6 max-w-lg mx-auto text-center">
      <p-card>
        <div class="flex flex-col items-center gap-4 py-8">
          <i class="pi pi-times-circle text-6xl text-orange-500"></i>
          <h2 class="text-3xl font-semibold">Payment Cancelled</h2>
          <p class="text-surface-500">
            Your payment was cancelled. No charges were made.
          </p>
          <p-button label="Try Again" icon="pi pi-tag" routerLink="/pricing" />
        </div>
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentCancelComponent {}
