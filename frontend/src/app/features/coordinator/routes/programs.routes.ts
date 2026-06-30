import { Route } from '@angular/router';

export const programsRoutes: Route[] = [
  {
    path: 'new',
    loadComponent: () =>
      import('@features/programs/pages/new-program/new-program.component'),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('@features/programs/pages/new-program/new-program.component'),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('@features/programs/pages/program-list/program-list.component'),
  },
];

export default programsRoutes;
