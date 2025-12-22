import { Routes } from '@angular/router';
import { PilaresListComponent } from './pilares-list/pilares-list.component';
import { PilaresFormComponent } from './pilares-form/pilares-form.component';
import { adminGuard } from '../../../core/guards/admin.guard';

// UI-PIL-008: Rotas protegidas por AdminGuard
export const pilaresRoutes: Routes = [
  {
    path: '',
    component: PilaresListComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'novo',
    component: PilaresFormComponent,
    canActivate: [adminGuard]
  },
  {
    path: ':id/editar',
    component: PilaresFormComponent,
    canActivate: [adminGuard]
  }
];
