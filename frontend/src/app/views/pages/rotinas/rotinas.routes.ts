import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { AdminGuard } from '../../../core/guards/admin.guard';

export const ROTINAS_ROUTES: Routes = [
  {
    path: '',
    component: () => import('./rotinas-list/rotinas-list.component').then(m => m.RotinasListComponent),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: 'novo',
    component: () => import('./rotina-form/rotina-form.component').then(m => m.RotinaFormComponent),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: 'editar/:id',
    component: () => import('./rotina-form/rotina-form.component').then(m => m.RotinaFormComponent),
    canActivate: [AuthGuard, AdminGuard],
  },
];
