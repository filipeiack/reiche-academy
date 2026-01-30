import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rotas que COLABORADOR não deve acessar
 * Permite acesso para: ADMINISTRADOR, CONSULTOR, GESTOR, LEITURA
 * Bloqueia: COLABORADOR
 */
export const nonColaboradorGuard: CanActivateFn = (route, state) => {
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
    router.navigate(['/diagnostico-notas']);
    return false;
  }
  
  const perfilCodigo = typeof currentUser.perfil === 'object' 
    ? currentUser.perfil.codigo 
    : currentUser.perfil;

  // COLABORADOR não tem acesso ao CRUD de usuários
  if (perfilCodigo === 'COLABORADOR') {
    router.navigate(['/diagnostico-notas']);
    return false;
  }

  return true;
};
