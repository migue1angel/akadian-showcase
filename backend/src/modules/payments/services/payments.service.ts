import { Injectable, Logger } from '@nestjs/common';
import { StripeProvider } from '../providers/stripe.provider';
import { CheckoutSessionParams, CheckoutSessionResult } from '../interfaces/payment-provider.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly stripeProvider: StripeProvider) {}

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    this.logger.log(`Creating Stripe checkout session for user: ${params.userId} and price: ${params.priceId}`);
    try {
      return await this.stripeProvider.createCheckoutSession(params);
    } catch (error) {
      this.logger.error(`Failed to create Stripe checkout session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
    try {
      const event = this.stripeProvider.constructWebhookEvent(rawBody, signature);
      this.logger.log(`Received Stripe Webhook Event: ${event.type} (ID: ${event.id})`);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          this.logger.log(`[Stripe Webhook] Checkout session completed. SessionID: ${session.id}, UserID: ${session.client_reference_id}, Email: ${session.customer_email}`);
          break;
        }
        case 'invoice.paid': {
          const invoice = event.data.object as any;
          this.logger.log(`[Stripe Webhook] Invoice paid successfully. InvoiceID: ${invoice.id}, SubscriptionID: ${invoice.subscription}, Amount: ${invoice.amount_paid / 100} ${invoice.currency}`);
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          this.logger.error(`[Stripe Webhook] Invoice payment failed. InvoiceID: ${invoice.id}, SubscriptionID: ${invoice.subscription}, Failure Reason: ${invoice.billing_reason}`);
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          this.logger.log(`[Stripe Webhook] Subscription deleted/cancelled. SubscriptionID: ${subscription.id}`);
          break;
        }
        default:
          this.logger.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Webhook signature verification/processing failed: ${error.message}`);
      throw error;
    }
  }
}
