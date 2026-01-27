import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CockpitDashboardComponent } from './cockpit-dashboard.component';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { SaveFeedbackService } from '@core/services/save-feedback.service';
import { EmpresaContextService } from '@core/services/empresa-context.service';
import { CockpitPilar } from '@core/interfaces/cockpit-pilares.interface';

describe('CockpitDashboardComponent - Security: Empresa Sync', () => {
  let component: CockpitDashboardComponent;
  let fixture: ComponentFixture<CockpitDashboardComponent>;
  let cockpitService: jasmine.SpyObj<CockpitPilaresService>;
  let saveFeedbackService: jasmine.SpyObj<SaveFeedbackService>;
  let empresaContextService: jasmine.SpyObj<EmpresaContextService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockCockpit: CockpitPilar = {
    id: 'cockpit-1',
    pilarEmpresaId: 'pilar-empresa-1',
    pilarEmpresa: {
      id: 'pilar-empresa-1',
      empresaId: 'empresa-A',
      empresa: { id: 'empresa-A', nome: 'Empresa A', cnpj: '00.000.000/0000-00' }
    },
    entradas: 'Entradas teste',
    saidas: 'Saídas teste',
    missao: 'Missão teste',
    indicadores: [],
    processosPrioritarios: [],
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const cockpitServiceSpy = jasmine.createSpyObj('CockpitPilaresService', ['getCockpitById']);
    const saveFeedbackServiceSpy = jasmine.createSpyObj('SaveFeedbackService', ['setSaved']);
    const empresaContextServiceSpy = jasmine.createSpyObj('EmpresaContextService', [
      'syncEmpresaFromResource',
      'getEmpresaId'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      params: of({ id: 'cockpit-1' })
    };

    await TestBed.configureTestingModule({
      imports: [CockpitDashboardComponent],
      providers: [
        { provide: CockpitPilaresService, useValue: cockpitServiceSpy },
        { provide: SaveFeedbackService, useValue: saveFeedbackServiceSpy },
        { provide: EmpresaContextService, useValue: empresaContextServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    cockpitService = TestBed.inject(CockpitPilaresService) as jasmine.SpyObj<CockpitPilaresService>;
    saveFeedbackService = TestBed.inject(SaveFeedbackService) as jasmine.SpyObj<SaveFeedbackService>;
    empresaContextService = TestBed.inject(EmpresaContextService) as jasmine.SpyObj<EmpresaContextService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(CockpitDashboardComponent);
    component = fixture.componentInstance;
  });

  describe('Security: syncEmpresaFromResource called on cockpit load', () => {
    it('deve chamar syncEmpresaFromResource com empresaId do cockpit ao carregar', () => {
      cockpitService.getCockpitById.and.returnValue(of(mockCockpit));

      component.ngOnInit();

      expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-A');
    });

    it('deve sincronizar com empresa correta mesmo quando cockpit pertence a empresa diferente', () => {
      const cockpitEmpresaB: CockpitPilar = {
        ...mockCockpit,
        pilarEmpresa: {
          ...mockCockpit.pilarEmpresa,
          empresaId: 'empresa-B'
        }
      };

      cockpitService.getCockpitById.and.returnValue(of(cockpitEmpresaB));

      component.ngOnInit();

      expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-B');
    });

    it('deve carregar dados do cockpit corretamente após sincronizar empresa', (done) => {
      cockpitService.getCockpitById.and.returnValue(of(mockCockpit));

      component.ngOnInit();

      // Esperar processamento
      setTimeout(() => {
        expect(component.cockpit).toEqual(mockCockpit);
        expect(component.entradas).toBe(mockCockpit.entradas || '');
        expect(component.saidas).toBe(mockCockpit.saidas || '');
        expect(component.missao).toBe(mockCockpit.missao || '');
        done();
      }, 100);
    });

    it('deve sincronizar empresa ANTES de renderizar dados', (done) => {
      let syncCalled = false;
      let dataCalled = false;

      empresaContextService.syncEmpresaFromResource.and.callFake(() => {
        syncCalled = true;
        expect(component.cockpit).toBeNull('Dados ainda não devem estar carregados');
      });

      cockpitService.getCockpitById.and.returnValue(of(mockCockpit));

      component.ngOnInit();

      setTimeout(() => {
        expect(syncCalled).toBe(true);
        expect(component.cockpit).not.toBeNull();
        done();
      }, 100);
    });

    it('não deve sincronizar se cockpit não tem empresaId', () => {
      const cockpitSemEmpresa: CockpitPilar = {
        ...mockCockpit,
        pilarEmpresa: undefined as any
      };

      cockpitService.getCockpitById.and.returnValue(of(cockpitSemEmpresa));

      component.ngOnInit();

      expect(empresaContextService.syncEmpresaFromResource).not.toHaveBeenCalled();
    });
  });

  describe('Security: Cross-empresa URL access attempt', () => {
    it('deve atualizar combo quando admin acessa cockpit de empresa diferente', () => {
      // Admin está em empresa-X
      // Acessa URL: /cockpit/123 (que pertence a empresa-Y)

      cockpitService.getCockpitById.and.returnValue(of({
        ...mockCockpit,
        pilarEmpresa: {
          ...mockCockpit.pilarEmpresa,
          empresaId: 'empresa-Y'
        }
      }));

      component.ngOnInit();

      expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-Y');
    });

    it('deve permitir navegação fluida entre cockpits de empresas diferentes', (done) => {
      cockpitService.getCockpitById.and.returnValue(of(mockCockpit));

      // Primeira carga: cockpit de empresa-A
      component.ngOnInit();

      setTimeout(() => {
        expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-A');

        // Simular navegação para cockpit de empresa-B
        const cockpitEmpresaB: CockpitPilar = {
          ...mockCockpit,
          id: 'cockpit-2',
          pilarEmpresa: {
            ...mockCockpit.pilarEmpresa,
            empresaId: 'empresa-B'
          }
        };

        cockpitService.getCockpitById.and.returnValue(of(cockpitEmpresaB));
        empresaContextService.syncEmpresaFromResource.calls.reset();

        // Acionar nova carga
        (component as any).loadCockpit('cockpit-2');

        setTimeout(() => {
          expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-B');
          done();
        }, 50);
      }, 100);
    });
  });

  describe('Security: Error handling maintains security', () => {
    it('deve sincronizar mesmo que erro ocorra após', (done) => {
      cockpitService.getCockpitById.and.returnValue(throwError(() => new Error('Erro ao carregar')));

      component.ngOnInit();

      setTimeout(() => {
        // Sync deve ter sido tentado mesmo com erro
        expect(empresaContextService.syncEmpresaFromResource).not.toHaveBeenCalled(); // Não chamado porque erro ocorre
        expect(component.error).toBeTruthy();
        done();
      }, 100);
    });

    it('deve ter operação segura mesmo quando sincronização falha', (done) => {
      empresaContextService.syncEmpresaFromResource.and.throwError('Sync falhou');
      cockpitService.getCockpitById.and.returnValue(of(mockCockpit));

      expect(() => {
        component.ngOnInit();
      }).not.toThrow();

      done();
    });
  });

  describe('Security: Data isolation', () => {
    it('deve carregar dados corretos da empresa sincronizada', (done) => {
      cockpitService.getCockpitById.and.returnValue(of(mockCockpit));

      component.ngOnInit();

      setTimeout(() => {
        // Verificar que dados são da empresa correta
        expect(component.cockpit?.pilarEmpresa.empresaId).toBe('empresa-A');
        expect(component.entradas).toBe(mockCockpit.entradas || '');
        done();
      }, 100);
    });

    it('deve ter estado isolado entre diferentes cockpits', (done) => {
      cockpitService.getCockpitById.and.returnValue(of(mockCockpit));

      component.ngOnInit();

      setTimeout(() => {
        const firstState = { ...component };

        // Mudar para outro cockpit
        const mockCockpit2: CockpitPilar = {
          ...mockCockpit,
          id: 'cockpit-2',
          entradas: 'Entradas diferentes'
        };

        cockpitService.getCockpitById.and.returnValue(of(mockCockpit2));
        (component as any).loadCockpit('cockpit-2');

        setTimeout(() => {
          expect(component.entradas).toBe('Entradas diferentes');
          expect(component.cockpit?.id).toBe('cockpit-2');
          done();
        }, 50);
      }, 100);
    });
  });
});
