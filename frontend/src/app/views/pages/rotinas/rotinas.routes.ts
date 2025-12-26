import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth.guard';
import { adminGuard } from '../../../core/guards/admin.guard';

export const ROTINAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./rotinas-list/rotinas-list.component').then(m => m.RotinasListComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'novo',
    loadComponent: () => import('./rotina-form/rotina-form.component').then(m => m.RotinaFormComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./rotina-form/rotina-form.component').then(m => m.RotinaFormComponent),
    canActivate: [authGuard, adminGuard],
  },
];
