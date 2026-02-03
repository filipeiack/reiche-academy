import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth.guard';
import { adminGuard } from '../../../core/guards/admin.guard';

export const OBJETIVOS_TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./objetivos-templates-list/objetivos-templates-list.component').then(
        (m) => m.ObjetivosTemplatesListComponent,
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./objetivo-template-form/objetivo-template-form.component').then(
        (m) => m.ObjetivoTemplateFormComponent,
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./objetivo-template-form/objetivo-template-form.component').then(
        (m) => m.ObjetivoTemplateFormComponent,
      ),
    canActivate: [authGuard, adminGuard],
  },
];
