import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'feed',
    loadComponent: () => import('./pages/feed/feed').then((m) => m.Feed),
    canActivate: [authGuard],
  },
  {
    path: 'refs/:id',
    loadComponent: () => import('./pages/ref-detail/ref-detail').then((m) => m.RefDetail),
    canActivate: [authGuard],
  },
  { path: '', pathMatch: 'full', redirectTo: 'feed' },
  { path: '**', redirectTo: 'feed' },
];
