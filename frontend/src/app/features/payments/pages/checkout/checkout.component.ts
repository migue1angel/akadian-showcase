import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PaymentsHttpService, StripeSessionResponse } from '../../services/payments-http.service';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { NotificationService } from '@core/services/ui/notification.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [Button, Card],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-3xl font-semibold mb-6">Checkout</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <p-card header="Membership Plan">
          <p class="m-0">Full access to all Akadian programs and features.</p>
          <p class="text-2xl font-bold mt-4">$50.00 / month</p>
          <ul class="mt-4 space-y-2 text-surface-600">
            <li>✓ All language programs</li>
            <li>✓ Unlimited classes</li>
            <li>✓ Progress tracking</li>
            <li>✓ Certificate on completion</li>
          </ul>
        </p-card>

        <p-card header="Summary">
          <div class="flex flex-col gap-4">
            <div class="flex justify-between">
              <span>Membership</span>
              <span>$50.00</span>
            </div>
            <hr />
            <div class="flex justify-between font-bold">
              <span>Total</span>
              <span>$50.00</span>
            </div>
            <p-button
              label="Pay with Stripe"
              icon="pi pi-credit-card"
              [loading]="loading()"
              styleClass="w-full mt-4"
              (click)="checkout()"
            />
          </div>
        </p-card>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CheckoutComponent {
  private readonly paymentsHttpService = inject(PaymentsHttpService);
  private readonly notificationService = inject(NotificationService);

  protected readonly loading = signal(false);

  checkout(): void {
    this.loading.set(true);
    this.paymentsHttpService.createCheckoutSession('price_monthly').subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.data?.url) {
          globalThis.location.href = response.data.url;
        }
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('Failed to create checkout session');
      },
    });
  }
}
