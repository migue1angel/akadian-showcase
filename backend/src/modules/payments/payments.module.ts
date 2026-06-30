import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeProvider],
})
export class PaymentsModule {}
