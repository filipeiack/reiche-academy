import { Routes } from '@angular/router';
import { UsuariosListComponent } from './usuarios-list/usuarios-list.component';
import { UsuariosFormComponent } from './usuarios-form/usuarios-form.component';

export const usuariosRoutes: Routes = [
  {
    path: '',
    component: UsuariosListComponent
  },
  {
    path: 'novo',
    component: UsuariosFormComponent
  },
  {
    path: ':id/editar',
    component: UsuariosFormComponent
  }
];
