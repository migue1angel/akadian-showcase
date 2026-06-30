import { Injectable } from '@nestjs/common';
import * as Stripe from 'stripe';
import { envs } from '../../../config/envs';
import { CheckoutSessionParams, CheckoutSessionResult, IPaymentProvider } from '../interfaces/payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private readonly stripe= new Stripe(envs.stripe.secretKey);

  constructor() {}

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: envs.stripe.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: envs.stripe.checkoutSuccessUrl,
      cancel_url: envs.stripe.checkoutCancelUrl,
      customer_email: params.userEmail,
      client_reference_id: params.userId,
      metadata: {
        userId: params.userId,
      },
    });

    return {
      id: session.id,
      url: session.url,
    };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      envs.stripe.webhookSecret,
    );
  }
}
