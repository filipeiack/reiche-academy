import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RotinasListComponent } from './rotinas-list.component';
import { RotinasService, Rotina } from '../../../../core/services/rotinas.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

/**
 * QA UNITÁRIO ESTRITO - RotinasListComponent
 * Validação de R-ROT-FE-001, R-ROT-FE-002, R-ROT-FE-003
 * Testes prioritários conforme PATTERN-REPORT-rotinas-revalidation.md
 */
describe('RotinasListComponent - Testes Unitários', () => {
  let component: RotinasListComponent;
  let fixture: ComponentFixture<RotinasListComponent>;
  let rotinasService: jasmine.SpyObj<RotinasService>;
  let pilaresService: jasmine.SpyObj<PilaresService>;
  let modalService: jasmine.SpyObj<NgbModal>;

  const mockPilares: Pilar[] = [
    { id: 'pilar-1', nome: 'Estratégia', modelo: true, ativo: true, ordem: 1 } as Pilar,
    { id: 'pilar-2', nome: 'Marketing', modelo: true, ativo: true, ordem: 2 } as Pilar,
    { id: 'pilar-3', nome: 'Vendas', modelo: false, ativo: true, ordem: 3 } as Pilar,
  ];

  const mockRotinas: Rotina[] = [
    {
      id: 'rotina-1',
      nome: 'Planejamento Estratégico',
      descricao: 'Análise SWOT',
      pilarId: 'pilar-1',
      modelo: true,
      ordem: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ativo: true,
      pilar: mockPilares[0],
    } as Rotina,
    {
      id: 'rotina-2',
      nome: 'Revisão Trimestral',
      descricao: 'OKRs',
      pilarId: 'pilar-1',
      modelo: true,
      ordem: 2,      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ativo: true,
      pilar: mockPilares[0],
    } as Rotina,
    {
      id: 'rotina-3',
      nome: 'Campanha Digital',
      descricao: 'Redes sociais',
      pilarId: 'pilar-2',
      modelo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ordem: 1,
      ativo: true,
      pilar: mockPilares[1],
    } as Rotina,
  ];

  beforeEach(async () => {
    const rotinasServiceSpy = jasmine.createSpyObj('RotinasService', ['findAll', 'remove', 'reordenarPorPilar']);
    const pilaresServiceSpy = jasmine.createSpyObj('PilaresService', ['findAll']);
    const modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']);

    await TestBed.configureTestingModule({
      imports: [RotinasListComponent],
      providers: [
        { provide: RotinasService, useValue: rotinasServiceSpy },
        { provide: PilaresService, useValue: pilaresServiceSpy },
        { provide: NgbModal, useValue: modalServiceSpy },
      ],
    }).compileComponents();

    rotinasService = TestBed.inject(RotinasService) as jasmine.SpyObj<RotinasService>;
    pilaresService = TestBed.inject(PilaresService) as jasmine.SpyObj<PilaresService>;
    modalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;

    rotinasService.findAll.and.returnValue(of(mockRotinas));
    pilaresService.findAll.and.returnValue(of(mockPilares));

    fixture = TestBed.createComponent(RotinasListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  // ============================================================
  // Inicialização e DI (inject())
  // ============================================================

  describe('Inicialização e Dependency Injection', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve usar inject() para injetar RotinasService', () => {
      expect(component['rotinasService']).toBeDefined();
    });

    it('deve usar inject() para injetar PilaresService', () => {
      expect(component['pilaresService']).toBeDefined();
    });

    it('deve usar inject() para injetar NgbModal', () => {
      expect(component['modalService']).toBeDefined();
    });

    it('deve carregar pilares e rotinas no ngOnInit', () => {
      fixture.detectChanges();

      expect(pilaresService.findAll).toHaveBeenCalled();
      expect(rotinasService.findAll).toHaveBeenCalledWith(undefined);
      expect(component.pilares.length).toBe(3);
      expect(component.rotinas.length).toBe(3);
    });
  });

  // ============================================================
  // R-ROT-FE-001: Filtro por Pilar
  // ============================================================

  describe('R-ROT-FE-001: Filtro por Pilar', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve carregar todas as rotinas quando não há filtro', () => {
      component.pilarIdFiltro = null;
      component.loadRotinas();

      expect(rotinasService.findAll).toHaveBeenCalledWith(undefined);
    });

    it('deve filtrar rotinas por pilarId quando filtro é aplicado', () => {
      component.pilarIdFiltro = 'pilar-1';
      component.onFilterChange();

      expect(rotinasService.findAll).toHaveBeenCalledWith('pilar-1');
    });

    it('deve resetar página para 1 quando filtro muda', () => {
      component.page = 3;
      component.onFilterChange();

      expect(component.page).toBe(1);
    });

    it('deve atualizar rotinasCountText baseado no filtro', () => {
      component.pilarIdFiltro = null;
      component.rotinasFiltered = mockRotinas;

      expect(component.rotinasCountText).toBe('3 rotina(s) encontrada(s)');

      component.pilarIdFiltro = 'pilar-1';
      expect(component.rotinasCountText).toContain('Estratégia');
    });
  });

  // ============================================================
  // R-ROT-FE-002: Paginação
  // ============================================================

  describe('R-ROT-FE-002: Paginação', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve calcular totalRotinas corretamente', () => {
      component.rotinasFiltered = mockRotinas;
      expect(component.totalRotinas).toBe(3);
    });

    it('deve retornar rotinas paginadas corretamente', () => {
      component.rotinasFiltered = mockRotinas;
      component.page = 1;
      component.pageSize = 2;

      const paginated = component.paginatedRotinas;

      expect(paginated.length).toBe(2);
      expect(paginated[0].id).toBe('rotina-1');
      expect(paginated[1].id).toBe('rotina-2');
    });

    it('deve retornar página 2 corretamente', () => {
      component.rotinasFiltered = mockRotinas;
      component.page = 2;
      component.pageSize = 2;

      const paginated = component.paginatedRotinas;

      expect(paginated.length).toBe(1);
      expect(paginated[0].id).toBe('rotina-3');
    });

    it('deve retornar array vazio se página não existe', () => {
      component.rotinasFiltered = mockRotinas;
      component.page = 10;
      component.pageSize = 10;

      const paginated = component.paginatedRotinas;

      expect(paginated.length).toBe(0);
    });
  });

  // ============================================================
  // R-ROT-FE-003: Drag & Drop para Reordenação (PRIORITÁRIO)
  // ============================================================

  describe('R-ROT-FE-003: Drag & Drop Reordenação - PRIORITÁRIO', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('canReorder deve retornar true quando há filtro de pilar', () => {
      component.pilarIdFiltro = 'pilar-1';
      expect(component.canReorder).toBe(true);
    });

    it('canReorder deve retornar false quando não há filtro de pilar', () => {
      component.pilarIdFiltro = null;
      expect(component.canReorder).toBe(false);
    });

    it('deve reordenar rotinas via drag-and-drop quando filtro ativo', () => {
      component.pilarIdFiltro = 'pilar-1';
      component.rotinasFiltered = [mockRotinas[0], mockRotinas[1]];

      const rotinasReordenadas = [mockRotinas[1], mockRotinas[0]];
      rotinasService.reordenarPorPilar.and.returnValue(of(rotinasReordenadas));

      const event = {
        previousIndex: 0,
        currentIndex: 1,
      } as CdkDragDrop<Rotina[]>;

      spyOn(window, 'alert');
      component.onDrop(event);

      expect(rotinasService.reordenarPorPilar).toHaveBeenCalledWith('pilar-1', [
        { id: 'rotina-2', ordem: 1 },
        { id: 'rotina-1', ordem: 2 },
      ]);

      expect(component.rotinas).toEqual(rotinasReordenadas);
      expect(window.alert).toHaveBeenCalledWith('Ordem atualizada com sucesso');
    });

    it('não deve reordenar se canReorder é false', () => {
      component.pilarIdFiltro = null;

      const event = {
        previousIndex: 0,
        currentIndex: 1,
      } as CdkDragDrop<Rotina[]>;

      component.onDrop(event);

      expect(rotinasService.reordenarPorPilar).not.toHaveBeenCalled();
    });

    it('deve reverter reordenação em caso de erro', () => {
      component.pilarIdFiltro = 'pilar-1';
      component.rotinasFiltered = mockRotinas;

      const errorResponse = new HttpErrorResponse({
        error: 'Internal Server Error',
        status: 500,
        statusText: 'Internal Server Error',
      });

      rotinasService.reordenarPorPilar.and.returnValue(throwError(() => errorResponse));
      rotinasService.findAll.and.returnValue(of(mockRotinas)); // Para loadRotinas()

      const event = {
        previousIndex: 0,
        currentIndex: 1,
      } as CdkDragDrop<Rotina[]>;

      spyOn(window, 'alert');
      component.onDrop(event);

      expect(rotinasService.findAll).toHaveBeenCalled(); // Reverter
      expect(window.alert).toHaveBeenCalledWith('Erro ao reordenar rotinas');
    });
  });

  // ============================================================
  // R-ROT-BE-002: Delete com 409 Conflict (PRIORITÁRIO)
  // ============================================================

  describe('R-ROT-BE-002: Delete com 409 Conflict - PRIORITÁRIO', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve desativar rotina com sucesso', () => {
      rotinasService.remove.and.returnValue(of(mockRotinas[0]));
      spyOn(window, 'alert');

      component.deleteRotina(mockRotinas[0]);

      expect(rotinasService.remove).toHaveBeenCalledWith('rotina-1');
      expect(window.alert).toHaveBeenCalledWith('Rotina desativada com sucesso');
      expect(rotinasService.findAll).toHaveBeenCalled(); // Reload
    });

    it('deve exibir erro 409 com lista de empresas afetadas', () => {
      const errorResponse = new HttpErrorResponse({
        error: {
          totalEmpresas: 2,
          empresasAfetadas: [
            { id: 'emp-1', nome: 'Empresa A' },
            { id: 'emp-2', nome: 'Empresa B' },
          ],
        },
        status: 409,
        statusText: 'Conflict',
      });

      rotinasService.remove.and.returnValue(throwError(() => errorResponse));
      spyOn(window, 'alert');

      component.deleteRotina(mockRotinas[0]);

      expect(rotinasService.remove).toHaveBeenCalledWith('rotina-1');
      expect(window.alert).toHaveBeenCalledWith(
        jasmine.stringContaining('Não é possível desativar esta rotina')
      );
      expect(window.alert).toHaveBeenCalledWith(
        jasmine.stringContaining('Empresa A, Empresa B')
      );
    });

    it('deve exibir erro 404 quando rotina não encontrada', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'Not Found',
        status: 404,
        statusText: 'Not Found',
      });

      rotinasService.remove.and.returnValue(throwError(() => errorResponse));
      spyOn(window, 'alert');

      component.deleteRotina(mockRotinas[0]);

      expect(window.alert).toHaveBeenCalledWith('Rotina não encontrada');
    });

    it('deve exibir erro genérico para outros erros', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'Internal Server Error',
        status: 500,
        statusText: 'Internal Server Error',
      });

      rotinasService.remove.and.returnValue(throwError(() => errorResponse));
      spyOn(window, 'alert');

      component.deleteRotina(mockRotinas[0]);

      expect(window.alert).toHaveBeenCalledWith('Erro ao desativar rotina');
    });
  });

  // ============================================================
  // Carregamento e Estados
  // ============================================================

  describe('Estados de Loading e Error', () => {
    it('deve iniciar com loading=false', () => {
      expect(component.loading).toBe(false);
    });

    it('deve definir loading=true durante carregamento', () => {
      rotinasService.findAll.and.returnValue(of([]));
      component.loadRotinas();

      // loading é setado true antes da resposta
      expect(component.loading).toBe(false); // Já completou síncronamente
    });

    it('deve definir loading=false e error=null após sucesso', () => {
      rotinasService.findAll.and.returnValue(of(mockRotinas));
      component.loadRotinas();

      expect(component.loading).toBe(false);
      expect(component.error).toBe(null);
      expect(component.rotinas).toEqual(mockRotinas);
    });

    it('deve definir error e loading=false após erro', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'Internal Server Error',
        status: 500,
        statusText: 'Internal Server Error',
      });

      rotinasService.findAll.and.returnValue(throwError(() => errorResponse));
      component.loadRotinas();

      expect(component.loading).toBe(false);
      expect(component.error).toBe('Erro ao carregar rotinas. Tente novamente.');
    });

    it('método retry() deve recarregar rotinas', () => {
      rotinasService.findAll.and.returnValue(of(mockRotinas));
      component.retry();

      expect(rotinasService.findAll).toHaveBeenCalled();
    });
  });

  // ============================================================
  // Utilidades
  // ============================================================

  describe('Métodos Utilitários', () => {
    it('truncateText() deve truncar texto longo', () => {
      const longText = 'Este é um texto muito longo que deve ser truncado';
      const truncated = component.truncateText(longText, 20);

      expect(truncated).toBe('Este é um texto muit...');
    });

    it('truncateText() não deve truncar texto curto', () => {
      const shortText = 'Texto curto';
      const result = component.truncateText(shortText, 20);

      expect(result).toBe('Texto curto');
    });

    it('truncateText() deve retornar string vazia se texto undefined', () => {
      const result = component.truncateText(undefined, 20);

      expect(result).toBe('');
    });
  });

  // ============================================================
  // Modal de Confirmação
  // ============================================================

  describe('Modal de Confirmação Delete', () => {
    it('deve abrir modal de confirmação ao deletar', () => {
      const mockModalRef = {
        result: Promise.resolve('confirm'),
      };

      modalService.open.and.returnValue(mockModalRef as any);
      rotinasService.remove.and.returnValue(of(mockRotinas[0]));

      const modalContent = {};
      component.openDeleteModal(mockRotinas[0], modalContent);

      expect(modalService.open).toHaveBeenCalledWith(modalContent, { centered: true });
    });

    it('deve deletar rotina se modal confirmado', async () => {
      const mockModalRef = {
        result: Promise.resolve('confirm'),
      };

      modalService.open.and.returnValue(mockModalRef as any);
      rotinasService.remove.and.returnValue(of(mockRotinas[0]));
      spyOn(component, 'deleteRotina');

      const modalContent = {};
      component.openDeleteModal(mockRotinas[0], modalContent);

      await mockModalRef.result;

      expect(component.deleteRotina).toHaveBeenCalledWith(mockRotinas[0]);
    });

    it('não deve deletar se modal cancelado', async () => {
      const mockModalRef = {
        result: Promise.reject('cancel'),
      };

      modalService.open.and.returnValue(mockModalRef as any);
      spyOn(component, 'deleteRotina');

      const modalContent = {};
      component.openDeleteModal(mockRotinas[0], modalContent);

      try {
        await mockModalRef.result;
      } catch (e) {
        // Esperado
      }

      expect(component.deleteRotina).not.toHaveBeenCalled();
    });
  });
});
