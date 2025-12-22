import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

/**
 * QA UNITÁRIO ESTRITO - AdminGuard (UI-PIL-008)
 * Valida controle de acesso ADMINISTRADOR
 */
describe('AdminGuard - UI-PIL-008', () => {
  let guard: typeof adminGuard;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    guard = adminGuard;
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ============================================================
  // UI-PIL-008: Permissões e Guards
  // ============================================================

  describe('UI-PIL-008: Controle de acesso ADMINISTRADOR', () => {
    it('deve permitir acesso para ADMINISTRADOR', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'admin-id',
        nome: 'Admin',
        perfil: { codigo: 'ADMINISTRADOR' },
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('deve bloquear acesso para GESTOR', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'gestor-id',
        nome: 'Gestor',
        perfil: { codigo: 'GESTOR' },
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('deve bloquear acesso para COLABORADOR', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'colab-id',
        nome: 'Colaborador',
        perfil: { codigo: 'COLABORADOR' },
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('deve redirecionar para /auth/login se não autenticado', () => {
      authService.isLoggedIn.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('deve redirecionar para /auth/login se current_user não existir', () => {
      authService.isLoggedIn.and.returnValue(true);
      // localStorage vazio

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ============================================================
  // Storage Fallback (localStorage → sessionStorage)
  // ============================================================

  describe('Storage Fallback', () => {
    it('deve buscar current_user em localStorage primeiro', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'admin-id',
        perfil: { codigo: 'ADMINISTRADOR' },
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(true);
    });

    it('deve buscar current_user em sessionStorage se não estiver em localStorage', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'admin-id',
        perfil: { codigo: 'ADMINISTRADOR' },
      };
      sessionStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(true);
    });

    it('deve preferir localStorage sobre sessionStorage', () => {
      authService.isLoggedIn.and.returnValue(true);
      const adminUser = {
        id: 'admin-id',
        perfil: { codigo: 'ADMINISTRADOR' },
      };
      const gestorUser = {
        id: 'gestor-id',
        perfil: { codigo: 'GESTOR' },
      };

      localStorage.setItem('current_user', JSON.stringify(adminUser));
      sessionStorage.setItem('current_user', JSON.stringify(gestorUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      // Deve usar localStorage (ADMINISTRADOR)
      expect(result).toBe(true);
    });
  });

  // ============================================================
  // Formato de perfil (object vs string)
  // ============================================================

  describe('Formato de perfil', () => {
    it('deve lidar com perfil como objeto', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'admin-id',
        perfil: { codigo: 'ADMINISTRADOR', nome: 'Administrador' },
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(true);
    });

    it('deve lidar com perfil como string', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'admin-id',
        perfil: 'ADMINISTRADOR', // String direta
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(true);
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('deve bloquear se JSON inválido em current_user', () => {
      authService.isLoggedIn.and.returnValue(true);
      localStorage.setItem('current_user', 'invalid-json{');

      expect(() =>
        TestBed.runInInjectionContext(() => guard({} as any, {} as any)),
      ).toThrow();
    });

    it('deve bloquear se perfil for null', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'user-id',
        perfil: null,
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('deve bloquear se perfil.codigo for undefined', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'user-id',
        perfil: { nome: 'Sem código' }, // Sem campo codigo
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('deve ser case-sensitive em perfil.codigo', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'user-id',
        perfil: { codigo: 'administrador' }, // lowercase
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any),
      );

      expect(result).toBe(false); // Deve bloquear (case-sensitive)
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('deve bloquear perfis diferentes de ADMINISTRADOR', () => {
      authService.isLoggedIn.and.returnValue(true);
      const perfis = ['CONSULTOR', 'LEITURA', 'OUTRO', 'ADMIN', 'Admin'];

      perfis.forEach((codigo) => {
        router.navigate.calls.reset();
        const mockUser = { id: 'user-id', perfil: { codigo } };
        localStorage.setItem('current_user', JSON.stringify(mockUser));

        const result = TestBed.runInInjectionContext(() =>
          guard({} as any, {} as any),
        );

        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      });
    });
  });

  // ============================================================
  // Redirects Corretos
  // ============================================================

  describe('Redirects', () => {
    it('deve redirecionar para /auth/login se não estiver logado', () => {
      authService.isLoggedIn.and.returnValue(false);

      TestBed.runInInjectionContext(() => guard({} as any, {} as any));

      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('deve redirecionar para /dashboard se não for ADMINISTRADOR', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'gestor-id',
        perfil: { codigo: 'GESTOR' },
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      TestBed.runInInjectionContext(() => guard({} as any, {} as any));

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('não deve redirecionar se for ADMINISTRADOR', () => {
      authService.isLoggedIn.and.returnValue(true);
      const mockUser = {
        id: 'admin-id',
        perfil: { codigo: 'ADMINISTRADOR' },
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      TestBed.runInInjectionContext(() => guard({} as any, {} as any));

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
