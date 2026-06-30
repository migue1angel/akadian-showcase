
export interface CheckoutSessionParams {
  priceId: string;
  userId: string;
  userEmail: string;
}

export interface CheckoutSessionResult {
  id: string;
  url: string | null;
}

export interface IPaymentProvider {
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;
  constructWebhookEvent(rawBody: Buffer, signature: string): any;
}
