import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

interface MessageOptions {
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  key?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly messageService = inject(MessageService);

  private readonly defaultLifetimes = {
    success: 3000,
    info: 4000,
    warn: 5000,
    error: 7000,
    contrast: 4000,
    secondary: 4000,
  };

  constructor() {}

  showSuccess(
    response: any,
    summary: string = 'Success',
    options?: MessageOptions,
  ) {
    const detail =
      typeof response === 'string'
        ? response
        : response?.message || 'Operation successful';

    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: options?.life ?? this.defaultLifetimes.success,
      sticky: options?.sticky,
      closable: options?.closable ?? true,
      key: options?.key,
      data: options?.data,
    });
  }

  showInfo(
    detail: string,
    summary: string = 'Information',
    options?: MessageOptions,
  ) {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: options?.life ?? this.defaultLifetimes.info,
      sticky: options?.sticky,
      closable: options?.closable ?? true,
      key: options?.key,
      data: options?.data,
    });
  }

  showWarning(
    detail: string,
    summary: string = 'Warning',
    options?: MessageOptions,
  ) {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life: options?.life ?? this.defaultLifetimes.warn,
      sticky: options?.sticky,
      closable: options?.closable ?? true,
      key: options?.key,
      data: options?.data,
    });
  }

  showWarn(
    detail: string = 'Warning message',
    summary: string = 'Warning',
    options?: MessageOptions,
  ) {
    this.showWarning(detail, summary, options);
  }

  showError(
    detail: string,
    summary: string = 'Error',
    options?: MessageOptions,
  ) {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: options?.life ?? this.defaultLifetimes.error,
      sticky: options?.sticky,
      closable: options?.closable ?? true,
      key: options?.key,
      data: options?.data,
    });
  }

  showErrors(
    errors: string[],
    summary: string = 'Errors found',
    options?: MessageOptions,
  ) {
    if (!errors || errors.length === 0) {
      this.showError('Unknown error', summary, options);
      return;
    }

    if (errors.length === 1) {
      this.showError(errors[0], summary, options);
      return;
    }

    this.messageService.add({
      severity: 'error',
      summary,
      detail: errors.length ? errors.join('\n') : undefined,
      life: options?.life ?? this.defaultLifetimes.error,
      sticky: options?.sticky ?? true,
      closable: options?.closable ?? true,
      key: options?.key,
      data: options?.data,
    });
  }

  showContrast(
    detail: string = 'Contrast message',
    summary: string = 'Contrast',
    options?: MessageOptions,
  ) {
    this.messageService.add({
      severity: 'contrast',
      summary,
      detail,
      life: options?.life ?? this.defaultLifetimes.contrast,
      sticky: options?.sticky,
      closable: options?.closable ?? true,
      key: options?.key,
      data: options?.data,
    });
  }

  showSecondary(
    detail: string = 'Secondary message',
    summary: string = 'Secondary',
    options?: MessageOptions,
  ) {
    this.messageService.add({
      severity: 'secondary',
      summary,
      detail,
      life: options?.life ?? this.defaultLifetimes.secondary,
      sticky: options?.sticky,
      closable: options?.closable ?? true,
      key: options?.key,
      data: options?.data,
    });
  }

  clear(key?: string) {
    this.messageService.clear(key);
  }

  showLoading(
    detail: string = 'Processing...',
    summary: string = 'Loading',
    key: string = 'loading',
  ) {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      sticky: true,
      closable: false,
      key,
    });
  }

  closeLoading(key: string = 'loading') {
    this.clear(key);
  }

  showActionSuccess(action: string, entity?: string) {
    const entityText = entity ? ` ${entity}` : '';
    this.showSuccess(
      `${entityText} ${action} successfully`,
      'Operation successful',
    );
  }

  showConnectionError() {
    this.showError(
      'Could not connect to the server. Please check your internet connection.',
      'Connection error',
      { sticky: true },
    );
  }

  showValidationError(fields?: string[]) {
    const detail =
      fields && fields.length > 0
        ? `Please verify the following fields: ${fields.join(', ')}`
        : 'Please verify the entered data';

    this.showError(detail, 'Validation error');
  }

  showSessionExpired() {
    this.showWarning(
      'Your session has expired. Please log in again.',
      'Session expired',
      { sticky: true },
    );
  }

  showPermissionDenied() {
    this.showError(
      'You do not have sufficient permissions to perform this action.',
      'Access denied',
    );
  }
}
