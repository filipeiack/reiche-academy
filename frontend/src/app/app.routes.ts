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
    path: 'usuarios',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./views/pages/usuarios/usuarios.routes').then(m => m.usuariosRoutes)
      }
    ]
  },
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
  },
  {
    path: 'pilares',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./views/pages/pilares/pilares.routes').then(m => m.pilaresRoutes)
      }
    ]
  },
  {
    path: 'rotinas',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./views/pages/rotinas/rotinas.routes').then(m => m.ROTINAS_ROUTES)
      }
    ]
  },
  {
    path: 'indicadores-templates',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./views/pages/indicadores-templates/indicadores-templates.routes').then(
            m => m.INDICADORES_TEMPLATES_ROUTES,
          )
      }
    ]
  },
  {
    path: 'objetivos-templates',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./views/pages/objetivos-templates/objetivos-templates.routes').then(
            m => m.OBJETIVOS_TEMPLATES_ROUTES,
          )
      }
    ]
  },
  {
    path: 'diagnostico-notas',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./views/pages/diagnostico-notas/diagnostico-notas.component').then(m => m.DiagnosticoNotasComponent)
      }
    ]
  },
  {
    path: 'diagnostico-evolucao',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./views/pages/diagnostico-evolucao/diagnostico-evolucao.component').then(m => m.DiagnosticoEvolucaoComponent)
      }
    ]
  },
  {
    path: 'cockpits',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./views/pages/cockpit-pilares/lista-cockpits/lista-cockpits.component').then(m => m.ListaCockpitsComponent)
      },
      {
        path: ':id/dashboard',
        loadComponent: () => import('./views/pages/cockpit-pilares/cockpit-dashboard/cockpit-dashboard.component').then(m => m.CockpitDashboardComponent)
      }
    ]
  },
  // Rota wildcard para login customizado - DEVE SER A ÚLTIMA!
  // Captura qualquer URL não reconhecida e trata como loginUrl
  {
    path: ':loginUrl',
    loadComponent: () => import('./views/pages/auth/login/login.component').then(c => c.LoginComponent)
  }
];
