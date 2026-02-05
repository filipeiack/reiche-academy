import { Routes } from '@angular/router';
import { UsuariosListComponent } from './usuarios-list/usuarios-list.component';
import { UsuariosFormComponent } from './usuarios-form/usuarios-form.component';
import { adminGuard } from '../../../core/guards/admin.guard';

// Apenas ADMINISTRADOR acessa tela de CRUD de usuários
// GESTOR/COLABORADOR/LEITURA podem adicionar usuários via drawers em outras telas
export const usuariosRoutes: Routes = [
  {
    path: '',
    component: UsuariosListComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'novo',
    component: UsuariosFormComponent,
    canActivate: [adminGuard]
  },
  {
    path: ':id/editar',
    component: UsuariosFormComponent,
    canActivate: [adminGuard]
  }
];
