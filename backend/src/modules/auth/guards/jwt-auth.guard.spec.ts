import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuariosService } from '../../usuarios/usuarios.service';

// Mock do AuthGuard para bypass do super.canActivate()
jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockImplementation(() => {
    return class MockAuthGuard {
      canActivate() {
        return Promise.resolve(true); // Simula token válido
      }
    };
  }),
}));

describe('JwtAuthGuard - Critical Security Tests', () => {
  let guard: JwtAuthGuard;

  const mockContext = (headers?: any, user?: any, params?: any, query?: any, body?: any): ExecutionContext => {
    const mockRequest = {
      headers: headers || {},
      user,
      params: params || {},
      query: query || {},
      body: body || {},
    };
    
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: UsuariosService,
          useValue: {
            validateToken: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  describe('multi-tenant validation', () => {
    it('should allow access for same company', async () => {
      const gestorUser = {
        id: 'user-1',
        email: 'gestor@company-a.com',
        perfil: { codigo: 'GESTOR' },
        empresaId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const context = mockContext(
        { authorization: 'Bearer valid-token' },
        gestorUser,
        { empresaId: '123e4567-e89b-12d3-a456-426614174000' } // params.empresaId
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should block cross-tenant access', async () => {
      const gestorUser = {
        id: 'user-1',
        email: 'gestor@company-a.com',
        perfil: { codigo: 'GESTOR' },
        empresaId: 'company-a-uuid',
      };

      const context = mockContext(
        { authorization: 'Bearer valid-token' },
        gestorUser,
        { empresaId: '123e4567-e89b-12d3-a456-426614174001' } // params.empresaId diferente
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin access to any company', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@system.com',
        perfil: { codigo: 'ADMINISTRADOR' },
        empresaId: '00000000-0000-0000-0000-000000000000',
      };

      const context = mockContext(
        { authorization: 'Bearer valid-token' },
        adminUser,
        { empresaId: '99999999-9999-9999-9999-999999999999' } // params.empresaId qualquer
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

it('should validate UUID format', async () => {
      const gestorUser = {
        id: 'user-1',
        email: 'gestor@company-a.com',
        perfil: { codigo: 'GESTOR' },
        empresaId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const context = mockContext(
        { authorization: 'Bearer valid-token' },
        gestorUser,
        { empresaId: 'not-a-uuid-at-all' } // UUID inválido
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

it('should accept empresaId from query', async () => {
      const gestorUser = {
        id: 'user-1',
        email: 'gestor@company-a.com',
        perfil: { codigo: 'GESTOR' },
        empresaId: '123e4567-e89b-12d3-a456-426614174000', // Usuário da mesma empresa
      };

      const context = mockContext(
        { authorization: 'Bearer valid-token' },
        gestorUser,
        null, // no params
        { empresaId: '123e4567-e89b-12d3-a456-426614174000' } // query.empresaId - mesma empresa
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

it('should accept empresaId from body', async () => {
      const gestorUser = {
        id: 'user-1',
        email: 'gestor@company-a.com',
        perfil: { codigo: 'GESTOR' },
        empresaId: '123e4567-e89b-12d3-a456-426614174000', // Usuário da mesma empresa
      };

      const context = mockContext(
        { authorization: 'Bearer valid-token' },
        gestorUser,
        null, // no params
        null, // no query
        { empresaId: '123e4567-e89b-12d3-a456-426614174000' } // body.empresaId - mesma empresa
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access when no empresaId requested', async () => {
      const gestorUser = {
        id: 'user-1',
        email: 'gestor@company-a.com',
        perfil: { codigo: 'GESTOR' },
        empresaId: 'company-a-uuid',
      };

      const context = mockContext(
        { authorization: 'Bearer valid-token' },
        gestorUser
        // sem params.empresaId, query.empresaId, ou body.empresaId
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should block unauthorized user', async () => {
      const context = mockContext(
        { authorization: 'Bearer valid-token' }
        // sem user no request
      );

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('priority order for empresaId extraction', () => {
    it('should prioritize params.empresaId over query and body', async () => {
      const gestorUser = {
        id: 'user-1',
        perfil: { codigo: 'GESTOR' },
        empresaId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const context = mockContext(
        { authorization: 'Bearer valid-token' },
        gestorUser,
        { empresaId: '123e4567-e89b-12d3-a456-426614174000' }, // params - DEVE prevalecer
        { empresaId: 'wrong-company-uuid' }, // query - ignorado
        { empresaId: 'wrong-company-uuid' }  // body - ignorado
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should fallback to query.empresaId when params empty', async () => {
      const gestorUser = {
        id: 'user-1',
        perfil: { codigo: 'GESTOR' },
        empresaId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const context = mockContext(
        { authorization: 'Bearer valid-token' },
        gestorUser,
        null, // no params
        { empresaId: '123e4567-e89b-12d3-a456-426614174000' }, // query - usado
        { empresaId: 'wrong-company-uuid' }  // body - ignorado
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });
});