import { Route } from '@angular/router';
import { CoordinatorComponent } from './coordinator.component';

export const coordinatorRoutes: Route[] = [
  {
    path: '',
    component: CoordinatorComponent,
    children: [
      {
        path: 'programs',
        loadChildren: () => import('./routes/programs.routes'),
      },
      {
        path: '',
        redirectTo: 'programs/list',
        pathMatch: 'full',
      },
    ],
  },
];
export default coordinatorRoutes;
