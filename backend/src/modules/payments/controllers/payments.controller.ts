import { BadRequestException, Body, Controller, Headers, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { PaymentsService } from '../services/payments.service';
import { CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';

import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Stripe checkout session URL created' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @CurrentUser() user: any,
  ) {
    return await this.paymentsService.createCheckoutSession({
      priceId: dto.priceId,
      userId: user.sub,
      userEmail: user.email,
    });
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Stripe event received and processed' })
  @ApiResponse({ status: 400, description: 'Webhook signature verification failed or raw body missing' })
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    // Stripe webhooks require the raw request body to verify the signature
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw request body is missing. Ensure Nest rawBody is enabled.');
    }
    await this.paymentsService.handleWebhookEvent(rawBody, signature);
    return { received: true };
  }
}
