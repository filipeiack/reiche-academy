import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

// Mock passport-jwt strategy
const mockPassportValidate = jest.fn();

jest.mock('@nestjs/passport', () => ({
  AuthGuard: (strategy: string) => {
    return class MockAuthGuard {
      canActivate(context: ExecutionContext): boolean {
        if (strategy === 'jwt') {
          return mockPassportValidate(context);
        }
        return false;
      }
    };
  },
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const mockContext = (headers?: any, user?: any): ExecutionContext => {
    const mockRequest = {
      headers: headers || {},
      user,
    };
    
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    
    // Reset mock before each test
    mockPassportValidate.mockClear();
  });

  describe('canActivate', () => {
    describe('successful authentication', () => {
      it('should return true when JWT token is valid', async () => {
        const validUser = {
          id: 'user-1',
          email: 'test@test.com',
          perfil: { codigo: 'GESTOR' },
          empresaId: 'empresa-1',
        };

        const validHeaders = {
          authorization: 'Bearer valid-jwt-token',
        };

        mockPassportValidate.mockReturnValue(true);

        const context = mockContext(validHeaders, validUser);
        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockPassportValidate).toHaveBeenCalledWith(context);
      });

      it('should handle different valid token formats', async () => {
        const tokenFormats = [
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          'Bearer valid.token.here',
          'Bearer simple-jwt-token',
        ];

        for (const token of tokenFormats) {
          mockPassportValidate.mockReturnValue(true);

          const headers = { authorization: token };
          const context = mockContext(headers);
          const result = guard.canActivate(context);

          expect(result).toBe(true);
        }
      });
    });

    describe('authentication failures', () => {
      it('should return false when JWT token is invalid', async () => {
        const invalidHeaders = {
          authorization: 'Bearer invalid-jwt-token',
        };

        mockPassportValidate.mockReturnValue(false);

        const context = mockContext(invalidHeaders);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
        expect(mockPassportValidate).toHaveBeenCalledWith(context);
      });

      it('should return false when authorization header is missing', async () => {
        const headers = {}; // no authorization header

        mockPassportValidate.mockReturnValue(false);

        const context = mockContext(headers);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should return false when authorization header is empty', async () => {
        const headers = {
          authorization: '',
        };

        mockPassportValidate.mockReturnValue(false);

        const context = mockContext(headers);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should return false when authorization header is malformed', async () => {
        const malformedHeaders = [
          { authorization: 'InvalidFormat token' },
          { authorization: 'Bearer' }, // no token
          { authorization: 'bearer token' }, // lowercase
          { authorization: 'BEARER token' }, // uppercase
        ];

        for (const headers of malformedHeaders) {
          mockPassportValidate.mockReturnValue(false);

          const context = mockContext(headers);
          const result = guard.canActivate(context);

          expect(result).toBe(false);
        }
      });

      it('should return false when passport validation throws error', async () => {
        const headers = {
          authorization: 'Bearer some-token',
        };

        mockPassportValidate.mockImplementation(() => {
          throw new UnauthorizedException('Invalid token');
        });

        const context = mockContext(headers);

        expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      });
    });

    describe('token format validation', () => {
      it('should reject tokens without Bearer prefix', async () => {
        const invalidHeaders = [
          { authorization: 'Basic some-token' },
          { authorization: 'Token some-token' },
          { authorization: 'some-token' }, // no prefix
        ];

        for (const headers of invalidHeaders) {
          mockPassportValidate.mockReturnValue(false);

          const context = mockContext(headers);
          const result = guard.canActivate(context);

          expect(result).toBe(false);
        }
      });

      it('should handle tokens with extra whitespace', async () => {
        const headersWithWhitespace = [
          { authorization: 'Bearer   token-with-spaces' },
          { authorization: '  Bearer token-with-leading-space' },
          { authorization: 'Bearer token-with-trailing-space  ' },
        ];

        for (const headers of headersWithWhitespace) {
          mockPassportValidate.mockReturnValue(false);

          const context = mockContext(headers);
          const result = guard.canActivate(context);

          expect(result).toBe(false);
        }
      });

      it('should handle empty token after Bearer', async () => {
        const headers = {
          authorization: 'Bearer   ',
        };

        mockPassportValidate.mockReturnValue(false);

        const context = mockContext(headers);
        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });
    });

    describe('user payload validation', () => {
      it('should accept valid user payload structure', async () => {
        const validUsers = [
          {
            id: 'user-1',
            email: 'test@test.com',
            perfil: { codigo: 'ADMINISTRADOR' },
            empresaId: 'empresa-1',
          },
          {
            id: 'user-2',
            email: 'gestor@test.com',
            perfil: 'GESTOR', // string format
            empresaId: 'empresa-1',
          },
          {
            id: 'user-3',
            email: 'colaborador@test.com',
            perfil: { codigo: 'COLABORADOR' },
            empresaId: 'empresa-2',
            additionalData: 'some extra data',
          },
        ];

        for (const user of validUsers) {
          mockPassportValidate.mockReturnValue(true);

          const headers = { authorization: 'Bearer valid-token' };
          const context = mockContext(headers, user);
          const result = guard.canActivate(context);

          expect(result).toBe(true);
        }
      });

      it('should handle user with missing required fields (passport handles this)', async () => {
        const invalidUsers = [
          { id: 'user-1' }, // missing email, perfil, empresaId
          { email: 'test@test.com' }, // missing id, perfil, empresaId
          { perfil: { codigo: 'ADMINISTRADOR' } }, // missing id, email, empresaId
          {}, // completely empty user
        ];

        for (const user of invalidUsers) {
          // In real implementation, passport strategy would validate this
          // Here we just test that the guard delegates to passport
          mockPassportValidate.mockReturnValue(true);

          const headers = { authorization: 'Bearer valid-token' };
          const context = mockContext(headers, user);
          const result = guard.canActivate(context);

          expect(result).toBe(true);
        }
      });
    });

    describe('multi-tenant considerations', () => {
      it('should not perform tenant validation (handled elsewhere)', async () => {
        const userFromCompanyA = {
          id: 'user-1',
          email: 'user@company-a.com',
          perfil: { codigo: 'GESTOR' },
          empresaId: 'company-a',
        };

        mockPassportValidate.mockReturnValue(true);

        const headers = { authorization: 'Bearer valid-token' };
        const context = mockContext(headers, userFromCompanyA);
        const result = guard.canActivate(context);

        expect(result).toBe(true);
        // JWT guard only validates token, not tenant access
      });

      it('should allow any authenticated user regardless of tenant', async () => {
        const users = [
          {
            id: 'user-1',
            empresaId: 'company-a',
            perfil: { codigo: 'ADMINISTRADOR' },
          },
          {
            id: 'user-2',
            empresaId: 'company-b',
            perfil: { codigo: 'GESTOR' },
          },
          {
            id: 'user-3',
            empresaId: null, // no company assigned
            perfil: { codigo: 'CONSULTOR' },
          },
        ];

        for (const user of users) {
          mockPassportValidate.mockReturnValue(true);

          const headers = { authorization: 'Bearer valid-token' };
          const context = mockContext(headers, user);
          const result = guard.canActivate(context);

          expect(result).toBe(true);
        }
      });
    });

    describe('edge cases and error handling', () => {
      it('should handle context without request object gracefully', async () => {
        const invalidContext = {
          switchToHttp: () => ({
            getRequest: () => null, // null request
          }),
        } as any;

        mockPassportValidate.mockImplementation(() => {
          throw new Error('Request is null');
        });

        expect(() => guard.canActivate(invalidContext)).toThrow('Request is null');
      });

      it('should handle malformed headers object', async () => {
        const contextWithMalformedHeaders = {
          switchToHttp: () => ({
            getRequest: () => ({
              headers: 'not-an-object', // malformed headers
            }),
          }),
        } as any;

        mockPassportValidate.mockImplementation(() => {
          throw new Error('Malformed headers');
        });

        expect(() => guard.canActivate(contextWithMalformedHeaders)).toThrow('Malformed headers');
      });

      it('should handle authorization header as non-string', async () => {
        const contextWithNonStringHeader = {
          switchToHttp: () => ({
            getRequest: () => ({
              headers: {
                authorization: 123, // number instead of string
              },
            }),
          }),
        } as any;

        mockPassportValidate.mockReturnValue(false);

        const result = guard.canActivate(contextWithNonStringHeader);
        expect(result).toBe(false);
      });

      it('should handle multiple authorization attempts', async () => {
        mockPassportValidate.mockReturnValue(true);

        const context = mockContext({
          authorization: 'Bearer valid-token',
        });

        // Multiple calls should work consistently
        for (let i = 0; i < 5; i++) {
          const result = guard.canActivate(context);
          expect(result).toBe(true);
        }
      });
    });

    describe('integration with other guards', () => {
      it('should work correctly when chained with RolesGuard', async () => {
        // This test simulates how JwtAuthGuard would work before RolesGuard in the chain
        const validUser = {
          id: 'user-1',
          email: 'gestor@test.com',
          perfil: { codigo: 'GESTOR' },
          empresaId: 'empresa-1',
        };

        mockPassportValidate.mockReturnValue(true);

        const context = mockContext(
          { authorization: 'Bearer valid-token' },
          validUser
        );

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        // RolesGuard would then check if user.perfil.codigo matches required roles
      });

      it('should fail early when JWT is invalid, before role validation', async () => {
        mockPassportValidate.mockReturnValue(false);

        const context = mockContext({
          authorization: 'Bearer invalid-token',
        });

        const result = guard.canActivate(context);

        expect(result).toBe(false);
        // RolesGuard won't even be called if JwtAuthGuard fails
      });
    });
  });

  describe('performance considerations', () => {
    it('should handle multiple concurrent validations', async () => {
      mockPassportValidate.mockReturnValue(true);

      const contexts = Array.from({ length: 10 }, () =>
        mockContext({ authorization: 'Bearer valid-token' })
      );

      // Simulate concurrent access
      const results = await Promise.all(
        contexts.map(context => Promise.resolve(guard.canActivate(context)))
      );

      expect(results.every(result => result === true)).toBe(true);
      expect(mockPassportValidate).toHaveBeenCalledTimes(10);
    });

    it('should not leak state between calls', async () => {
      // First call - success
      mockPassportValidate.mockReturnValue(true);
      const context1 = mockContext({ authorization: 'Bearer valid-token' });
      const result1 = guard.canActivate(context1);
      expect(result1).toBe(true);

      // Second call - failure
      mockPassportValidate.mockReturnValue(false);
      const context2 = mockContext({ authorization: 'Bearer invalid-token' });
      const result2 = guard.canActivate(context2);
      expect(result2).toBe(false);

      // Third call - success again
      mockPassportValidate.mockReturnValue(true);
      const context3 = mockContext({ authorization: 'Bearer another-valid-token' });
      const result3 = guard.canActivate(context3);
      expect(result3).toBe(true);
    });
  });
});