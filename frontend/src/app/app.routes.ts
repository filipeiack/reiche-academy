import { Routes } from '@angular/router';
import { BaseComponent } from './views/layout/base/base.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./views/pages/auth/auth.routes')
  },
  {
    path: 'dashboard',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./views/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      }
    ]
  },
  {
    path: 'usuarios',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./views/pages/usuarios/usuarios.routes').then(m => m.usuariosRoutes)
      }
    ]
  }
  ,
  {
    path: 'empresas',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./views/pages/empresas/empresas.routes').then(m => m.EMPRESAS_ROUTES)
      }
    ]
  }
];

