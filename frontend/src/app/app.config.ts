import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { MyPreset } from '../../mypreset';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { layoutInterceptor } from './core/interceptors/layout.interceptor';
import { httpMessageInterceptor } from './core/interceptors/http-message.interceptor';
import { authInterceptor } from '@core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    ConfirmationService,
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        httpMessageInterceptor,
        layoutInterceptor,
        authInterceptor,
      ]),
    ),
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: '.my-app-dark',
        },
      },
    }),
  ],
};
