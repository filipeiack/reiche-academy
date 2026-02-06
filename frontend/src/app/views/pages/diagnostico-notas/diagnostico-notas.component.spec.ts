import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, delay } from 'rxjs';
import { DiagnosticoNotasComponent } from './diagnostico-notas.component';
import { DiagnosticoNotasService, PilarEmpresa } from '@core/services/diagnostico-notas.service';
import { EmpresasService } from '@core/services/empresas.service';
import { AuthService } from '@core/services/auth.service';
import { EmpresaContextService } from '@core/services/empresa-context.service';
import { PeriodosAvaliacaoService } from '@core/services/periodos-avaliacao.service';
import { TranslateService } from '@core/services/translate.service';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';

describe('DiagnosticoNotasComponent - Security: Empresa Sync', () => {
  let component: DiagnosticoNotasComponent;
  let fixture: ComponentFixture<DiagnosticoNotasComponent>;
  let diagnosticoService: jasmine.SpyObj<DiagnosticoNotasService>;
  let empresaContextService: jasmine.SpyObj<EmpresaContextService>;
  let empresasService: jasmine.SpyObj<EmpresasService>;
  let authService: jasmine.SpyObj<AuthService>;
  let periodosService: jasmine.SpyObj<PeriodosAvaliacaoService>;
  let offcanvasService: jasmine.SpyObj<NgbOffcanvas>;
  let router: jasmine.SpyObj<Router>;

  const mockPilarEmpresa: PilarEmpresa = {
    id: 'pilar-empresa-1',
    empresaId: 'empresa-A',
    nome: 'Pilar 1',
    ordem: 1,
    ativo: true,
    pilarTemplate: {
      id: 'pilar-1',
      nome: 'Pilar 1'
    },
    rotinasEmpresa: []
  };

  beforeEach(async () => {
    const diagnosticoServiceSpy = jasmine.createSpyObj('DiagnosticoNotasService', [
      'getDiagnosticoByEmpresa'
    ]);
    const empresasServiceSpy = jasmine.createSpyObj('EmpresasService', ['getEmpresas']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const empresaContextServiceSpy = jasmine.createSpyObj('EmpresaContextService', [
      'syncEmpresaFromResource',
      'getEmpresaId',
      'selectedEmpresaId$'
    ]);
    const periodosServiceSpy = jasmine.createSpyObj('PeriodosAvaliacaoService', ['getPrimeiraData']);
    const offcanvasServiceSpy = jasmine.createSpyObj('NgbOffcanvas', ['open', 'close']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    empresaContextServiceSpy.selectedEmpresaId$ = of('empresa-A');
    periodosServiceSpy.getPrimeiraData.and.returnValue(of({ primeiraData: null }));

    await TestBed.configureTestingModule({
      imports: [DiagnosticoNotasComponent],
      providers: [
        { provide: DiagnosticoNotasService, useValue: diagnosticoServiceSpy },
        { provide: EmpresasService, useValue: empresasServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: EmpresaContextService, useValue: empresaContextServiceSpy },
        { provide: PeriodosAvaliacaoService, useValue: periodosServiceSpy },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        { provide: NgbOffcanvas, useValue: offcanvasServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { params: of({}) } }
      ]
    }).compileComponents();

    diagnosticoService = TestBed.inject(DiagnosticoNotasService) as jasmine.SpyObj<DiagnosticoNotasService>;
    empresaContextService = TestBed.inject(EmpresaContextService) as jasmine.SpyObj<EmpresaContextService>;
    empresasService = TestBed.inject(EmpresasService) as jasmine.SpyObj<EmpresasService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    periodosService = TestBed.inject(PeriodosAvaliacaoService) as jasmine.SpyObj<PeriodosAvaliacaoService>;
    offcanvasService = TestBed.inject(NgbOffcanvas) as jasmine.SpyObj<NgbOffcanvas>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(DiagnosticoNotasComponent);
    component = fixture.componentInstance;
    component.selectedEmpresaId = 'empresa-A';
  });

  describe('Security: syncEmpresaFromResource called on diagnostico load', () => {
    it('deve chamar syncEmpresaFromResource com empresaId do primeiro pilar', (done) => {
      const pilares = [mockPilarEmpresa];
      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(pilares));

      (component as any).loadDiagnostico();

      setTimeout(() => {
        expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-A');
        done();
      }, 100);
    });

    it('deve sincronizar com empresa dos dados carregados', (done) => {
      const pilarEmpresaB: PilarEmpresa = {
        ...mockPilarEmpresa,
        empresaId: 'empresa-B'
      };

      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of([pilarEmpresaB]));

      (component as any).loadDiagnostico();

      setTimeout(() => {
        expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-B');
        done();
      }, 100);
    });

    it('deve usar primeira empresa como referência quando múltiplos pilares', (done) => {
      const pilarEmpresaA: PilarEmpresa = {
        ...mockPilarEmpresa,
        empresaId: 'empresa-A'
      };

      const pilarEmpresaB: PilarEmpresa = {
        ...mockPilarEmpresa,
        id: 'pilar-empresa-2',
        empresaId: 'empresa-B'
      };

      // Todos pilares devem ser da mesma empresa (dados válidos)
      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of([pilarEmpresaA, pilarEmpresaB]));

      (component as any).loadDiagnostico();

      setTimeout(() => {
        expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-A');
        done();
      }, 100);
    });

    it('não deve sincronizar se não há pilares carregados', (done) => {
      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of([]));

      (component as any).loadDiagnostico();

      setTimeout(() => {
        expect(empresaContextService.syncEmpresaFromResource).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('não deve sincronizar se pilar não tem empresaId', (done) => {
      const pilarSemEmpresa: PilarEmpresa = {
        ...mockPilarEmpresa,
        empresaId: undefined as any
      };

      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of([pilarSemEmpresa]));

      (component as any).loadDiagnostico();

      setTimeout(() => {
        expect(empresaContextService.syncEmpresaFromResource).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Security: Cross-empresa URL access attempt', () => {
    it('deve sincronizar com empresa correta mesmo navegando via URLs diretas', (done) => {
      // Simular: Admin em empresa-X, acessa URL de diagnostico selecionando empresa-Y
      const pilares = [
        {
          ...mockPilarEmpresa,
          empresaId: 'empresa-Y'
        }
      ];

      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(pilares));
      component.selectedEmpresaId = 'empresa-Y';

      (component as any).loadDiagnostico();

      setTimeout(() => {
        expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-Y');
        done();
      }, 100);
    });

    it('deve recarregar dados quando empresa muda na combo', (done) => {
      const pilares = [mockPilarEmpresa];
      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(pilares));

      (component as any).loadDiagnostico();

      setTimeout(() => {
        expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-A');

        // Simular mudança de empresa na combo
        const newPilares = [
          {
            ...mockPilarEmpresa,
            empresaId: 'empresa-B'
          }
        ];

        diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(newPilares));
        empresaContextService.syncEmpresaFromResource.calls.reset();

        component.selectedEmpresaId = 'empresa-B';
        (component as any).loadDiagnostico();

        setTimeout(() => {
          expect(empresaContextService.syncEmpresaFromResource).toHaveBeenCalledWith('empresa-B');
          expect(diagnosticoService.getDiagnosticoByEmpresa).toHaveBeenCalledTimes(2);
          done();
        }, 50);
      }, 100);
    });
  });

  describe('Security: Data integrity after sync', () => {
    it('deve carregar dados corretos após sincronizar empresa', (done) => {
      const pilares = [mockPilarEmpresa];
      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(pilares));

      (component as any).loadDiagnostico();

      setTimeout(() => {
        expect(component.pilares).toEqual(pilares);
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('deve manter isolamento de dados entre empresas', (done) => {
      const pilaresEmpresaA = [
        {
          ...mockPilarEmpresa,
          empresaId: 'empresa-A',
          id: 'pilar-a-1'
        }
      ];

      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(pilaresEmpresaA));
      component.selectedEmpresaId = 'empresa-A';

      (component as any).loadDiagnostico();

      setTimeout(() => {
        expect(component.pilares[0].empresaId).toBe('empresa-A');

        // Mudar para empresa B
        const pilaresEmpresaB = [
          {
            ...mockPilarEmpresa,
            empresaId: 'empresa-B',
            id: 'pilar-b-1'
          }
        ];

        diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(pilaresEmpresaB));
        component.selectedEmpresaId = 'empresa-B';

        (component as any).loadDiagnostico();

        setTimeout(() => {
          expect(component.pilares[0].empresaId).toBe('empresa-B');
          expect(component.pilares[0].id).toBe('pilar-b-1');
          done();
        }, 50);
      }, 100);
    });
  });

  describe('Security: Scroll position preserved safely', () => {
    it('deve preservar scroll durante mudança de empresa sem vazar dados', (done) => {
      window.pageYOffset = 500;

      const pilares = [mockPilarEmpresa];
      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(pilares));

      (component as any).loadDiagnostico(true); // preserve scroll

      setTimeout(() => {
        expect(component.pilares).toEqual(pilares);
        done();
      }, 100);
    });
  });

  describe('Security: Loading state prevents race conditions', () => {
    it('deve ter loading true durante carregamento', fakeAsync(() => {
      const pilares = [mockPilarEmpresa];
      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(pilares).pipe(delay(10)));

      (component as any).loadDiagnostico();
      expect(component.loading).toBe(true);

      tick(10);
      expect(component.loading).toBe(false);
    }));

    it('deve limpar erro anterior ao carregar', (done) => {
      component.error = 'Erro anterior';

      const pilares = [mockPilarEmpresa];
      diagnosticoService.getDiagnosticoByEmpresa.and.returnValue(of(pilares));

      (component as any).loadDiagnostico();

      expect(component.error).toBe('');
      done();
    });
  });
});
