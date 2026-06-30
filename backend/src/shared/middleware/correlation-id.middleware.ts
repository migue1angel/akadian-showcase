import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationHeader = req.header('x-correlation-id') || req.header('X-Correlation-ID');
    
    // Generate UUID v4 if not provided
    const correlationId = correlationHeader || randomUUID();
    
    // Set on request context and response headers
    req['correlationId'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    
    next();
  }
}
