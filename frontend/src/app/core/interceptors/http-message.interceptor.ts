import {
  HttpErrorResponse,
  HttpResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { NotificationService } from '@core/services/ui/notification.service';
import {
  tap,
  catchError,
  throwError,
  retry,
  timer,
  timeout,
  TimeoutError,
} from 'rxjs';

const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [0, 408, 429, 500, 502, 503, 504],
  retryableMethods: ['GET', 'HEAD', 'OPTIONS'],
  excludePatterns: ['/auth/', '/login'], // No reintentar auth endpoints
};

const TIMEOUT_CONFIG = {
  default: 30000,
  long: 60000,
  auth: 10000, // Timeout más corto para auth
};

export const httpMessageInterceptor: HttpInterceptorFn = (req, next) => {
  const customMessageService = inject(NotificationService);

  const timeoutDuration = getTimeoutForRequest(req);

  return next(req).pipe(
    timeout(timeoutDuration),

    retry({
      count: RETRY_CONFIG.maxRetries,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        if (!shouldRetry(error, req.method, req.url)) {
          throw error;
        }

        const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount - 1);

        console.warn(
          `🔄 Retrying request (${retryCount}/${RETRY_CONFIG.maxRetries})`,
          `Next attempt in ${delay}ms`,
          `URL: ${req.url}`
        );

        customMessageService.showWarning(
          'Unstable connection',
          `Retrying... (${retryCount}/${RETRY_CONFIG.maxRetries})`
        );

        return timer(delay);
      },
    }),

    catchError((error: unknown) => {
      let errorMessage = '';
      let errorTitle = '';
      const shouldShowMessage = !isAuthOperation(req);

      if (error instanceof TimeoutError) {
        errorTitle = 'Timeout';
        errorMessage =
          'The server is taking too long to respond. Please try again.';

        console.error('⏱️ Timeout:', {
          url: req.url,
          method: req.method,
          timeout: timeoutDuration,
        });

        if (shouldShowMessage) {
          customMessageService.showError(errorTitle, errorMessage);
        }
        return throwError(() => error);
      }

      if (error instanceof HttpErrorResponse) {
        const errorDetails = handleHttpError(error, req.method);
        errorTitle = errorDetails.title;
        errorMessage = errorDetails.message;

        console.error('❌ HTTP Error:', {
          status: error.status,
          statusText: error.statusText,
          url: req.url,
          method: req.method,
          error: error.error,
          shouldShowMessage,
        });

        // Mostrar mensaje si NO es auth O si es un 429 (rate limiting)
        if (shouldShowMessage || error.status === 429) {
          customMessageService.showError(errorTitle, errorMessage);
        }
      } else {
        errorTitle = 'Unexpected error';
        errorMessage = 'An unexpected error occurred. Please try again.';

        console.error('⚠️ Unknown error:', error);

        if (shouldShowMessage) {
          customMessageService.showError(errorTitle, errorMessage);
        }
      }

      return throwError(() => error);
    })
  );
};

function getTimeoutForRequest(req: any): number {
  // Timeout corto para operaciones de auth
  if (isAuthOperation(req)) {
    return TIMEOUT_CONFIG.auth;
  }

  // Timeout largo para operaciones pesadas
  if (isLongOperation(req)) {
    return TIMEOUT_CONFIG.long;
  }

  // Timeout por defecto
  return TIMEOUT_CONFIG.default;
}

function isAuthOperation(req: any): boolean {
  const authPatterns = ['/auth/', '/login', '/profile'];
  return authPatterns.some((pattern) =>
    req.url.toLowerCase().includes(pattern)
  );
}

function isLongOperation(req: any): boolean {
  const longOperationPatterns = [
    '/upload',
    '/download',
    '/export',
    '/import',
    '/report',
  ];

  return longOperationPatterns.some((pattern) =>
    req.url.toLowerCase().includes(pattern)
  );
}

function shouldRetry(
  error: HttpErrorResponse,
  method: string,
  url: string
): boolean {
  // No reintentar operaciones de auth
  if (isAuthOperation({ url })) {
    return false;
  }

  if (!RETRY_CONFIG.retryableMethods.includes(method.toUpperCase())) {
    return false;
  }

  return RETRY_CONFIG.retryableStatuses.includes(error.status);
}

function handleHttpError(
  error: HttpErrorResponse,
  method: string
): {
  title: string;
  message: string;
} {
  if (error.status === 0) {
    return {
      title: '🔌 No connection',
      message:
        'Cannot connect to the server. Check your internet connection or try again later.',
    };
  }

  if (error.status >= 400 && error.status < 500) {
    switch (error.status) {
      case 400:
        return {
          title: 'Bad request',
          message: error.error?.message || 'The submitted data is not valid.',
        };

      case 401:
        return {
          title: 'Unauthorized',
          message: 'Your session has expired. Please log in again.',
        };

      case 403:
        return {
          title: 'Access denied',
          message: 'You do not have permission to perform this action.',
        };

      case 404:
        return {
          title: 'Not found',
          message: 'The requested resource does not exist or has been deleted.',
        };

      case 408:
        return {
          title: 'Timeout',
          message: 'The request took too long. Please try again.',
        };

      case 429:
        return {
          title: 'Too many requests',
          message:
            error.error?.message || 'You have exceeded the request limit. Wait a moment and try again.',
        };

      default:
        return {
          title: 'Request error',
          message:
            error.error?.message ||
            `Error ${error.status}: ${error.statusText}`,
        };
    }
  }

  if (error.status >= 500) {
    switch (error.status) {
      case 500:
        return {
          title: '⚠️ Server error',
          message:
            'An internal server error occurred. Our team has been notified.',
        };

      case 502:
        return {
          title: '🔧 Server unavailable',
          message:
            'The server is temporarily unavailable. Please try again in a few moments.',
        };

      case 503:
        return {
          title: '🚧 Service under maintenance',
          message: 'The service is temporarily offline for maintenance.',
        };

      case 504:
        return {
          title: '⏱️ Gateway timeout',
          message: 'The server took too long to respond. Please try again.',
        };

      default:
        return {
          title: 'Server error',
          message:
            error.error?.message ||
            `Error ${error.status}: ${error.statusText}`,
        };
    }
  }

  return {
    title: 'Error',
    message:
      error.error?.message ||
      error.message ||
      `Error ${error.status}: ${error.statusText}`,
  };
}
