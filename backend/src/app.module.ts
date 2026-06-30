import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { DatabaseModule } from './database/database.module';
import { IamModule } from './modules/iam/iam.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SeedModule } from './seed/seed.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    DatabaseModule,
    SharedModule,
    IamModule,
    ProgramsModule,
    PaymentsModule,
    EventEmitterModule.forRoot({
      wildcard: true, // Permite escuchar eventos como 'system.*'
      delimiter: '.', 
    }),
    NotificationsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

