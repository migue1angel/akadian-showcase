import { Injectable, Scope, Logger, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class LoggerService {
  private context = 'App';

  constructor(@Inject(REQUEST) private readonly request: Request) {}

  setContext(context: string) {
    this.context = context;
  }

  private get correlationId(): string {
    return this.request ? (this.request['correlationId'] as string) || '-' : '-';
  }

  private formatMessage(message: string): string {
    return `[CorrelationID: ${this.correlationId}] ${message}`;
  }

  log(message: string, context?: string) {
    Logger.log(this.formatMessage(message), context || this.context);
  }

  error(message: string, stack?: string, context?: string) {
    Logger.error(this.formatMessage(message), stack, context || this.context);
  }

  warn(message: string, context?: string) {
    Logger.warn(this.formatMessage(message), context || this.context);
  }

  debug(message: string, context?: string) {
    Logger.debug(this.formatMessage(message), context || this.context);
  }

  verbose(message: string, context?: string) {
    Logger.verbose(this.formatMessage(message), context || this.context);
  }
}
