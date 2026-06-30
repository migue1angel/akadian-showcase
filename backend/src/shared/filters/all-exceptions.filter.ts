import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DomainError } from '../errors/domain.error';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemErrorEvent } from '../system-error.event';
import { SYSTEM_ERROR_EVENT } from '../consts/events';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly eventEmitter: EventEmitter2) { }
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error'
    let code = 'INTERNAL_SERVER_ERROR'

    let internalMessage = exception instanceof Error ? exception.message : 'Unknown Error';

    if (exception instanceof DomainError) {
      status = exception.status;
      message = exception.message;
      code = exception.code;
      internalMessage = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res.message || exception.message;
      code = "HTTP_ERROR";
      internalMessage = message || exception.message;
    }

    const isInternalError = status >= 500;
    const correlationId = request['correlationId'] || '-';

    if (isInternalError) {
      this.logger.error(`[CRITICAL] [CorrelationID: ${correlationId}] ${request.method} ${request.url} - ${internalMessage}`, exception?.stack);

      this.eventEmitter.emit(
        SYSTEM_ERROR_EVENT,
        new SystemErrorEvent(internalMessage, exception?.stack || 'No stack trace', {
          code,
          path: request.url,
          method: request.method,
          body: this.sanitizeBody(request.body),
          correlationId,
        }),
      );
    }

    response.status(status).json({
      success: false,
      error: { code, message },
    });
  }

  private sanitizeBody(body: any) {
    if (!body) return {};
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '***REDACTED***';
    return sanitized;
  }
}
