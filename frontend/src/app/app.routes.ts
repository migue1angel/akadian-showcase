import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';
import { RolesEnum } from '@shared/enums/roles.enum';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes'),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component'),
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes'),
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes'),
      },
      {
        path: 'payments',
        loadChildren: () => import('./features/payments/payments.routes'),
      },
      {
        path: 'coordinator',
        canActivate: [authGuard, roleGuard([RolesEnum.COORDINATOR, RolesEnum.ADMIN])],
        loadChildren: () => import('./features/coordinator/coordinator.routes'),
      },
    ],
  },
  {
    path: 'not-found',
    loadComponent: () => import('./shared/pages/not-found/not-found.component'),
  },
  {
    path: '**',
    redirectTo: 'not-found',
    pathMatch: 'full',
  },
];
