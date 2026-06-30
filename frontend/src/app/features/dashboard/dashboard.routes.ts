import { Route } from '@angular/router';

export const dashboardRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard.component'),
  },
];

export default dashboardRoutes;
