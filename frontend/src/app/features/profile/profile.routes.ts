import { Route } from '@angular/router';

export const profileRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile/profile.component'),
  },
];

export default profileRoutes;
