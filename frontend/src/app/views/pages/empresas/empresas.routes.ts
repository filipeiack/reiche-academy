import { Routes } from '@angular/router';
import { EmpresasListComponent } from './empresas-list/empresas-list.component';

export const EMPRESAS_ROUTES: Routes = [
  { path: '', component: EmpresasListComponent },
  { path: 'nova', loadComponent: () => import('./empresas-form/empresas-form.component').then(m => m.EmpresasFormComponent) },
  { path: ':id/editar', loadComponent: () => import('./empresas-form/empresas-form.component').then(m => m.EmpresasFormComponent) },
];
