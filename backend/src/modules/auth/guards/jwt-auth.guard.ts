import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { UsuariosService } from '../../usuarios/usuarios.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usuariosService: UsuariosService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primeiro, validar o token JWT
    const result = await super.canActivate(context);
    if (!result) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Multi-tenant validation: para não-administradores, validar empresaId
    if (user.perfil?.codigo !== 'ADMINISTRADOR') {
      const requestedCompanyId = this.extractCompanyIdFromRequest(request);
      
      if (requestedCompanyId && user.empresaId !== requestedCompanyId) {
        throw new ForbiddenException('Acesso não autorizado para esta empresa');
      }
    }

    return true;
  }

  private extractCompanyIdFromRequest(request: any): string | null {
    // Extrair empresaId APENAS de fontes explícitas (não params.id genérico)
    const params = request.params || {};
    const query = request.query || {};
    const body = request.body || {};

    // ✅ SEGURANÇA: Aceita apenas empresaId explícito, não params.id genérico
    // params.id pode ser ID de qualquer entidade (usuário, pilar, etc.)
    const empresaId = params.empresaId || query.empresaId || body.empresaId;
    
    // Validar formato UUID se empresaId foi fornecido
    if (empresaId && !this.isValidUUID(empresaId)) {
      throw new ForbiddenException('EmpresaId inválido');
    }
    
    return empresaId || null;
  }

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
