import { Route } from '@angular/router';

export const paymentsRoutes: Route[] = [
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout.component'),
  },
  {
    path: 'success',
    loadComponent: () =>
      import('./pages/payment-success/payment-success.component'),
  },
  {
    path: 'cancel',
    loadComponent: () =>
      import('./pages/payment-cancel/payment-cancel.component'),
  },
  {
    path: '',
    redirectTo: 'checkout',
    pathMatch: 'full',
  },
];

export default paymentsRoutes;
