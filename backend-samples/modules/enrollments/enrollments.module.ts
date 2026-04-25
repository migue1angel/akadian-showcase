import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from '../common/entities/enrollment.entity';
import { Student } from '../common/entities/student.entity';
import { Course } from '../common/entities/course.entity';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { ClassSession, Subscription, SubscriptionType } from '../common/entities';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    EvaluationsModule,
    SubscriptionsModule,
    TypeOrmModule.forFeature([
      Enrollment,
      Student,
      Course,
      ClassSession,
      SubscriptionType,
      Subscription
    ]),
  ],
  providers: [EnrollmentsService],
  controllers: [EnrollmentsController],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
