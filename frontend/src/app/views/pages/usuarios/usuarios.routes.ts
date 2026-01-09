import { Routes } from '@angular/router';
import { UsuariosListComponent } from './usuarios-list/usuarios-list.component';
import { UsuariosFormComponent } from './usuarios-form/usuarios-form.component';
import { nonColaboradorGuard } from '../../../core/guards/non-colaborador.guard';

export const usuariosRoutes: Routes = [
  {
    path: '',
    component: UsuariosListComponent,
    canActivate: [nonColaboradorGuard]
  },
  {
    path: 'novo',
    component: UsuariosFormComponent,
    canActivate: [nonColaboradorGuard]
  },
  {
    path: ':id/editar',
    component: UsuariosFormComponent,
    canActivate: [nonColaboradorGuard]
  }
];
