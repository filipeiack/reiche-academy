import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as { perfil?: { codigo: Role } | Role } | undefined;
    if (!user || !user.perfil) return false;
    
    // Suporta tanto perfil como objeto { codigo } quanto string direta (retrocompatibilidade)
    const perfilCodigo = typeof user.perfil === 'object' ? user.perfil.codigo : user.perfil;
    return requiredRoles.includes(perfilCodigo);
  }
}
