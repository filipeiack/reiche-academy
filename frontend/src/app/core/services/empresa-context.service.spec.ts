import { TestBed } from '@angular/core/testing';
import { EmpresaContextService } from './empresa-context.service';
import { AuthService } from './auth.service';
import { Usuario } from '@app/core/models/auth.model';

describe('EmpresaContextService - Multi-tenant Security', () => {
  let service: EmpresaContextService;
  let authService: jasmine.SpyObj<AuthService>;

  const mockAdminUser: Usuario = {
    id: 'admin-1',
    email: 'admin@test.com',
    nome: 'Admin User',
    ativo: true,
    perfil: {
      id: 'perf-1',
      codigo: 'ADMINISTRADOR',
      nome: 'Administrador',
      nivel: 1
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockClientUser: Usuario = {
    id: 'client-1',
    email: 'cliente@test.com',
    nome: 'Client User',
    ativo: true,
    empresaId: 'empresa-A',
    perfil: {
      id: 'perf-2',
      codigo: 'COLABORADOR',
      nome: 'Colaborador',
      nivel: 3
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Mock AuthService
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    TestBed.configureTestingModule({
      providers: [
        EmpresaContextService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    service = TestBed.inject(EmpresaContextService);

    // Limpar localStorage antes de cada teste
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Security: syncEmpresaFromResource', () => {
    describe('Quando usuário é ADMINISTRADOR', () => {
      beforeEach(() => {
        authService.getCurrentUser.and.returnValue(mockAdminUser);
        // Reinicializar serviço para carregar novo usuário
        service = TestBed.inject(EmpresaContextService);
      });

      it('deve sincronizar empresa quando acessa recurso de empresa diferente', (done) => {
        service.setSelectedEmpresa('empresa-X');
        expect(service.getEmpresaId()).toBe('empresa-X');

        // Admin acessa cockpit de empresa-Y
        service.syncEmpresaFromResource('empresa-Y');

        service.selectedEmpresaId$.subscribe((empresaId) => {
          if (empresaId === 'empresa-Y') {
            expect(service.getEmpresaId()).toBe('empresa-Y');
            done();
          }
        });
      });

      it('deve preservar empresa se já está selecionada', () => {
        service.setSelectedEmpresa('empresa-A');
        const spy = spyOn(service, 'setSelectedEmpresa');

        // Acessa recurso da mesma empresa
        service.syncEmpresaFromResource('empresa-A');

        // setSelectedEmpresa não deve ser chamado
        expect(spy).not.toHaveBeenCalled();
      });

      it('deve atualizar localStorage quando sincroniza', (done) => {
        service.setSelectedEmpresa('empresa-X');
        
        service.syncEmpresaFromResource('empresa-Z');

        // Pequeno delay para localStorage atualizar
        setTimeout(() => {
          const stored = localStorage.getItem('selected_empresa_context');
          expect(stored).toBe('empresa-Z');
          done();
        }, 50);
      });

      it('deve bloquear admin de ficar preso em empresa após logout', () => {
        service.setSelectedEmpresa('empresa-A');
        service.syncEmpresaFromResource('empresa-B');
        expect(service.getEmpresaId()).toBe('empresa-B');

        // Simular logout
        service.clearSelectedEmpresa();
        expect(service.getEmpresaId()).toBeNull();
      });
    });

    describe('Quando usuário é CLIENTE', () => {
      beforeEach(() => {
        authService.getCurrentUser.and.returnValue(mockClientUser);
        // Reinicializar serviço para carregar novo usuário
        service = TestBed.inject(EmpresaContextService);
      });

      it('deve ignorar syncEmpresaFromResource e manter empresa do usuário', () => {
        // Cliente logado em empresa-A
        expect(service.getEmpresaId()).toBe('empresa-A');

        // Tenta "sincronizar" com empresa-B (atacante tenta mudar via URL)
        service.syncEmpresaFromResource('empresa-B');

        // Deve continuar em empresa-A
        expect(service.getEmpresaId()).toBe('empresa-A');
      });

      it('deve não persistir alterações no localStorage para cliente', (done) => {
        const initialStorage = localStorage.getItem('selected_empresa_context');

        // Cliente tenta sincronizar com outra empresa
        service.syncEmpresaFromResource('empresa-B');

        setTimeout(() => {
          const afterStorage = localStorage.getItem('selected_empresa_context');
          expect(afterStorage).toEqual(initialStorage);
          done();
        }, 50);
      });

      it('deve sempre retornar empresa do usuário mesmo após múltiplas sync calls', () => {
        const empresaIds = ['empresa-X', 'empresa-Y', 'empresa-Z', 'empresa-W'];

        empresaIds.forEach((id) => {
          service.syncEmpresaFromResource(id);
          expect(service.getEmpresaId()).toBe('empresa-A', `Deve manter empresa-A após tentar sync com ${id}`);
        });
      });
    });
  });

  describe('Security: getEmpresaId context isolation', () => {
    it('[ADMIN] deve retornar empresa selecionada manualmente', () => {
      authService.getCurrentUser.and.returnValue(mockAdminUser);
      service = TestBed.inject(EmpresaContextService);

      service.setSelectedEmpresa('empresa-A');
      expect(service.getEmpresaId()).toBe('empresa-A');

      service.setSelectedEmpresa('empresa-B');
      expect(service.getEmpresaId()).toBe('empresa-B');
    });

    it('[CLIENTE] deve sempre retornar empresa do usuário, não selecionada', () => {
      authService.getCurrentUser.and.returnValue(mockClientUser);
      service = TestBed.inject(EmpresaContextService);

      // Tenta setar outra empresa (não deve funcionar)
      (service as any).selectedEmpresaIdSubject.next('empresa-X');

      // Deve retornar empresa do usuário, não empresa-X
      expect(service.getEmpresaId()).toBe('empresa-A');
    });

    it('[ADMIN] deve retornar null quando não há empresa selecionada', () => {
      authService.getCurrentUser.and.returnValue(mockAdminUser);
      service = TestBed.inject(EmpresaContextService);

      service.clearSelectedEmpresa();
      expect(service.getEmpresaId()).toBeNull();
    });

    it('[CLIENTE] deve retornar empresa mesmo sem seleção manual', () => {
      authService.getCurrentUser.and.returnValue(mockClientUser);
      service = TestBed.inject(EmpresaContextService);

      // Não há empresa selecionada manualmente
      service.clearSelectedEmpresa();

      // Mas deve retornar empresa do usuário
      expect(service.getEmpresaId()).toBe('empresa-A');
    });
  });

  describe('Security: Observable context', () => {
    it('[ADMIN] observable deve refletir mudanças de empresa', (done) => {
      authService.getCurrentUser.and.returnValue(mockAdminUser);
      service = TestBed.inject(EmpresaContextService);

      let updateCount = 0;
      const expectedEmpresas = ['empresa-1', 'empresa-2'];

      service.selectedEmpresaId$.subscribe((empresaId) => {
        if (updateCount < 2) {
          expect(empresaId).toBe(expectedEmpresas[updateCount]);
          updateCount++;

          if (updateCount === 2) {
            done();
          }
        }
      });

      service.setSelectedEmpresa('empresa-1');
      setTimeout(() => service.setSelectedEmpresa('empresa-2'), 10);
    });

    it('[CLIENTE] observable deve ignorar tentativas de mudança', (done) => {
      authService.getCurrentUser.and.returnValue(mockClientUser);
      service = TestBed.inject(EmpresaContextService);

      const emissions: (string | null)[] = [];

      service.selectedEmpresaId$.subscribe((empresaId) => {
        emissions.push(empresaId);
      });

      // Tenta mudar para outras empresas
      service.setSelectedEmpresa('empresa-X');
      service.setSelectedEmpresa('empresa-Y');
      service.syncEmpresaFromResource('empresa-Z');

      setTimeout(() => {
        // Observable nunca deve emitir outras empresas
        const otherEmpresas = emissions.filter((id) => id !== null && id !== 'empresa-A');
        expect(otherEmpresas.length).toBe(0);
        done();
      }, 50);
    });
  });

  describe('Security: isAdmin flag consistency', () => {
    it('deve indicar corretamente quando usuário é admin', () => {
      authService.getCurrentUser.and.returnValue(mockAdminUser);
      service = TestBed.inject(EmpresaContextService);

      expect(service.isAdmin()).toBe(true);
    });

    it('deve indicar corretamente quando usuário não é admin', () => {
      authService.getCurrentUser.and.returnValue(mockClientUser);
      service = TestBed.inject(EmpresaContextService);

      expect(service.isAdmin()).toBe(false);
    });

    it('deve retornar false quando não há usuário autenticado', () => {
      authService.getCurrentUser.and.returnValue(null);
      service = TestBed.inject(EmpresaContextService);

      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('Security: URL parameter exploitation attempt', () => {
    it('[ADMIN] deve sincronizar com URL param empresaId mesmo que diferente', () => {
      authService.getCurrentUser.and.returnValue(mockAdminUser);
      service = TestBed.inject(EmpresaContextService);

      // Admin em empresa-A, acessa URL: /cockpit/123?empresaId=empresa-B
      service.setSelectedEmpresa('empresa-A');
      service.syncEmpresaFromResource('empresa-B');

      expect(service.getEmpresaId()).toBe('empresa-B');
    });

    it('[CLIENTE] deve ignorar URL param empresaId', () => {
      authService.getCurrentUser.and.returnValue(mockClientUser);
      service = TestBed.inject(EmpresaContextService);

      // Cliente em empresa-A, acessa URL: /cockpit/123?empresaId=empresa-B
      service.syncEmpresaFromResource('empresa-B');

      expect(service.getEmpresaId()).toBe('empresa-A');
    });
  });

  describe('Security: Brute force empresa selection', () => {
    it('[CLIENTE] deve permanecer preso em empresa após múltiplas tentativas', () => {
      authService.getCurrentUser.and.returnValue(mockClientUser);
      service = TestBed.inject(EmpresaContextService);

      const empresasParaTentar = ['empresa-B', 'empresa-C', 'empresa-D', 'empresa-E', 'empresa-F'];

      empresasParaTentar.forEach((empresaId) => {
        service.syncEmpresaFromResource(empresaId);
        service.setSelectedEmpresa(empresaId);
      });

      // Deve continuar empresa-A
      expect(service.getEmpresaId()).toBe('empresa-A');
    });

    it('[ADMIN] deve permitir alteração entre empresas legalmente', () => {
      authService.getCurrentUser.and.returnValue(mockAdminUser);
      service = TestBed.inject(EmpresaContextService);

      const empresasParaVisitar = ['empresa-1', 'empresa-2', 'empresa-3'];

      empresasParaVisitar.forEach((empresaId, index) => {
        service.syncEmpresaFromResource(empresaId);
        expect(service.getEmpresaId()).toBe(empresaId, `Deve estar em ${empresaId} na iteração ${index}`);
      });
    });
  });

  describe('Security: localStorage tampering', () => {
    it('[ADMIN] deve verificar permissão ao carregar localStorage', () => {
      // Adicionar empresa fraudulenta no localStorage
      localStorage.setItem('selected_empresa_context', 'empresa-fraud');

      authService.getCurrentUser.and.returnValue(mockAdminUser);
      service = TestBed.inject(EmpresaContextService);

      // Deve carregar do localStorage pois é admin
      expect(service.getEmpresaId()).toBe('empresa-fraud');
    });

    it('[CLIENTE] deve ignorar localStorage mesmo que tenha valor', () => {
      // Colocar empresa fraudulenta no localStorage
      localStorage.setItem('selected_empresa_context', 'empresa-fraud');

      authService.getCurrentUser.and.returnValue(mockClientUser);
      service = TestBed.inject(EmpresaContextService);

      // Deve retornar empresa do usuário, não do localStorage
      expect(service.getEmpresaId()).toBe('empresa-A');
    });
  });
});
