import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '../decorators/roles.decorator';
import { SetMetadata } from '@nestjs/common';

// Mock SetMetadata decorator
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn(),
}));

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockContext = (user?: any, handler?: any): ExecutionContext => {
    const mockHandler = handler || (() => {});
    const mockRequest = { user };
    
    return {
      getHandler: () => mockHandler,
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    describe('when no roles are required', () => {
      it('should return true when no roles are defined', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(undefined);

        const context = mockContext();
        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(reflector.get).toHaveBeenCalledWith('roles', expect.any(Function));
      });

      it('should return true when empty roles array is defined', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue([]);

        const context = mockContext();
        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('when user is not authenticated', () => {
      it('should return false when user is undefined', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const context = mockContext(undefined);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should return false when user is null', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const context = mockContext(null);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should return false when user has no perfil property', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const user = { id: 'user-1', email: 'test@test.com' }; // no perfil
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });
    });

    describe('when user has perfil as object', () => {
      it('should return true when user role matches required role', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const user = {
          id: 'user-1',
          email: 'admin@test.com',
          perfil: { codigo: 'ADMINISTRADOR' },
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should return true when user has one of multiple required roles', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR', 'GESTOR']);

        const user = {
          id: 'user-1',
          email: 'gestor@test.com',
          perfil: { codigo: 'GESTOR' },
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should return false when user role does not match required role', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const user = {
          id: 'user-1',
          email: 'gestor@test.com',
          perfil: { codigo: 'GESTOR' },
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should return false when user role is not in multiple required roles', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR', 'GESTOR']);

        const user = {
          id: 'user-1',
          email: 'colaborador@test.com',
          perfil: { codigo: 'COLABORADOR' },
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should handle case sensitivity correctly', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const user = {
          id: 'user-1',
          email: 'test@test.com',
          perfil: { codigo: 'administrador' }, // lowercase
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(false); // Case sensitive comparison
      });
    });

    describe('when user has perfil as string (retrocompatibility)', () => {
      it('should return true when user role matches required role', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['GESTOR']);

        const user = {
          id: 'user-1',
          email: 'gestor@test.com',
          perfil: 'GESTOR', // string directly
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should return true when user has one of multiple required roles', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['GESTOR', 'COLABORADOR']);

        const user = {
          id: 'user-1',
          email: 'colaborador@test.com',
          perfil: 'COLABORADOR',
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should return false when user role does not match required role', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const user = {
          id: 'user-1',
          email: 'gestor@test.com',
          perfil: 'GESTOR',
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });
    });

    describe('when user has null perfil', () => {
      it('should return false when perfil is null', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const user = {
          id: 'user-1',
          email: 'test@test.com',
          perfil: null,
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should return false when perfil is undefined', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const user = {
          id: 'user-1',
          email: 'test@test.com',
          perfil: undefined,
        };
        const context = mockContext(user);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });
    });

    describe('complex scenarios', () => {
      it('should handle all user roles', async () => {
        const allRoles = ['ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'LEITURA', 'CONSULTOR'];
        
        for (const role of allRoles) {
          jest.spyOn(reflector, 'get').mockReturnValue([role]);

          const user = {
            id: 'user-1',
            email: 'test@test.com',
            perfil: { codigo: role },
          };
          const context = mockContext(user);
          const result = guard.canActivate(context);

          expect(result).toBe(true);
        }
      });

      it('should handle cross-role access scenarios', async () => {
        const testCases = [
          {
            required: ['ADMINISTRADOR'],
            userRole: 'ADMINISTRADOR',
            expected: true,
          },
          {
            required: ['ADMINISTRADOR'],
            userRole: 'GESTOR',
            expected: false,
          },
          {
            required: ['GESTOR', 'COLABORADOR'],
            userRole: 'GESTOR',
            expected: true,
          },
          {
            required: ['GESTOR', 'COLABORADOR'],
            userRole: 'COLABORADOR',
            expected: true,
          },
          {
            required: ['GESTOR', 'COLABORADOR'],
            userRole: 'ADMINISTRADOR',
            expected: false,
          },
        ];

        for (const testCase of testCases) {
          jest.spyOn(reflector, 'get').mockReturnValue(testCase.required);

          const user = {
            id: 'user-1',
            email: 'test@test.com',
            perfil: { codigo: testCase.userRole },
          };
          const context = mockContext(user);
          const result = guard.canActivate(context);

          expect(result).toBe(testCase.expected);
        }
      });

      it('should handle edge cases with malformed user objects', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const malformedUsers = [
          { id: 'user-1' }, // no perfil
          { perfil: 'STRING_NOT_OBJECT' }, // perfil as string but object format expected
          { perfil: {} }, // empty object
          { perfil: { wrongProperty: 'ADMINISTRADOR' } }, // missing codigo property
          { perfil: { codigo: null } }, // null codigo
          { perfil: { codigo: '' } }, // empty codigo
        ];

        for (const user of malformedUsers) {
          const context = mockContext(user);
          const result = guard.canActivate(context);

          expect(result).toBe(false);
        }
      });
    });

    describe('reflector integration', () => {
      it('should call reflector.get with correct parameters', async () => {
        const mockHandler = jest.fn();
        jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR']);

        const context = mockContext(
          { perfil: { codigo: 'ADMINISTRADOR' } },
          mockHandler
        );

        guard.canActivate(context);

        expect(reflector.get).toHaveBeenCalledWith('roles', mockHandler);
      });

      it('should handle reflector returning null', async () => {
        jest.spyOn(reflector, 'get').mockReturnValue(null);

        const context = mockContext({ perfil: { codigo: 'ADMINISTRADOR' } });
        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should handle reflector throwing error', async () => {
        jest.spyOn(reflector, 'get').mockImplementation(() => {
          throw new Error('Reflector error');
        });

        const context = mockContext({ perfil: { codigo: 'ADMINISTRADOR' } });

        expect(() => guard.canActivate(context)).toThrow('Reflector error');
      });
    });
  });

  describe('multi-tenant considerations', () => {
    it('should allow access based solely on role (company validation handled elsewhere)', async () => {
      // This guard only validates roles, multi-tenant validation should be handled separately
      jest.spyOn(reflector, 'get').mockReturnValue(['GESTOR']);

      const userFromAnotherCompany = {
        id: 'user-1',
        email: 'other@test.com',
        empresaId: 'other-company',
        perfil: { codigo: 'GESTOR' },
      };
      
      const context = mockContext(userFromAnotherCompany);
      const result = guard.canActivate(context);

      // Role check passes (multi-tenant validation should be in another guard/service)
      expect(result).toBe(true);
    });

    it('should validate role regardless of company context', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(['LEITURA']);

      const userFromCompanyA = {
        id: 'user-1',
        empresaId: 'company-a',
        perfil: { codigo: 'LEITURA' },
      };

      const context = mockContext(userFromCompanyA);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('performance and edge cases', () => {
    it('should handle large required roles array efficiently', async () => {
      const manyRoles = Array.from({ length: 100 }, (_, i) => `ROLE_${i}`);
      jest.spyOn(reflector, 'get').mockReturnValue(manyRoles);

      const user = {
        id: 'user-1',
        perfil: { codigo: 'ROLE_50' },
      };

      const context = mockContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle duplicate roles in required array', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(['ADMINISTRADOR', 'ADMINISTRADOR', 'GESTOR']);

      const user = {
        id: 'user-1',
        perfil: { codigo: 'ADMINISTRADOR' },
      };

      const context = mockContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle empty string role', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(['']);

      const user = {
        id: 'user-1',
        perfil: { codigo: '' },
      };

      const context = mockContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle special characters in role names', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(['ROLE_!@#$%^&*()']);

      const user = {
        id: 'user-1',
        perfil: { codigo: 'ROLE_!@#$%^&*()' },
      };

      const context = mockContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});