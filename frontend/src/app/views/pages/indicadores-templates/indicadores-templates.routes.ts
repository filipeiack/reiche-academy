import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth.guard';
import { adminGuard } from '../../../core/guards/admin.guard';

export const INDICADORES_TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./indicadores-templates-list/indicadores-templates-list.component').then(
        (m) => m.IndicadoresTemplatesListComponent,
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./indicador-template-form/indicador-template-form.component').then(
        (m) => m.IndicadorTemplateFormComponent,
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./indicador-template-form/indicador-template-form.component').then(
        (m) => m.IndicadorTemplateFormComponent,
      ),
    canActivate: [authGuard, adminGuard],
  },
];
