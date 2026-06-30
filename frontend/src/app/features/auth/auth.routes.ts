import { Route } from '@angular/router';
import { AuthComponent } from './auth.component';
import { blockLoginGuard } from '@core/guards/block-login.guard';

const authRoutes: Route[] = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: 'login',
        canActivate: [blockLoginGuard],
        loadComponent: () =>
          import('./pages/login/login.component'),
      },
      {
        path: 'success',
        loadComponent: () =>
          import('./pages/auth-success/auth-success.component'),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
];

export default authRoutes;
