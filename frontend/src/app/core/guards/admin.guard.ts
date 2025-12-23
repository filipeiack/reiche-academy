import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// UI-PIL-008: Guard para ADMINISTRADOR apenas
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar se está logado
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Obter usuário do storage
  const userJson = localStorage.getItem('current_user') || sessionStorage.getItem('current_user');
  if (!userJson) {
    router.navigate(['/auth/login']);
    return false;
  }

  const currentUser = JSON.parse(userJson);
  
  // Verificar se perfil existe
  if (!currentUser.perfil) {
    router.navigate(['/dashboard']);
    return false;
  }
  
  const perfilCodigo = typeof currentUser.perfil === 'object' 
    ? currentUser.perfil.codigo 
    : currentUser.perfil;

  if (perfilCodigo !== 'ADMINISTRADOR') {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
