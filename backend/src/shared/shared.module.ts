import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { LoggerService } from './services/logger.service';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Global()
@Module({
    providers: [
        LoggerService,
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor
        }
    ],
    exports: [LoggerService]
})
export class SharedModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(CorrelationIdMiddleware)
            .forRoutes('*');
    }
}
