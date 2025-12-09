import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    // Se o usuário está logado, permite acesso
    return true;
  }

  // Se não está logado, redireciona para login com a URL solicitada
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url.split('?')[0] } 
  });
  
  return false;
};
