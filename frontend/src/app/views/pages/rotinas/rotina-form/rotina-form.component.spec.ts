import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RotinaFormComponent } from './rotina-form.component';
import { RotinasService, CreateRotinaDto, UpdateRotinaDto, Rotina } from '../../../../core/services/rotinas.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * QA UNITÁRIO ESTRITO - RotinaFormComponent
 * Validação de R-ROT-001, UI-ROT-005, validações de formulário
 * Testes prioritários conforme PATTERN-REPORT-rotinas-revalidation.md
 */
describe('RotinaFormComponent - Testes Unitários', () => {
  let component: RotinaFormComponent;
  let fixture: ComponentFixture<RotinaFormComponent>;
  let rotinasService: jasmine.SpyObj<RotinasService>;
  let pilaresService: jasmine.SpyObj<PilaresService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockPilares: Pilar[] = [
    { id: 'pilar-1', nome: 'Estratégia', modelo: true, ativo: true, ordem: 1 } as Pilar,
    { id: 'pilar-2', nome: 'Marketing', modelo: true, ativo: true, ordem: 2 } as Pilar,
  ];

  const mockRotina: Rotina = {
    id: 'rotina-1',
    nome: 'Planejamento Estratégico',
    descricao: 'Análise SWOT',
    pilarId: 'pilar-1',
    modelo: true,
    ordem: 1,
    ativo: true,
    pilar: mockPilares[0],
  } as Rotina;

  beforeEach(async () => {
    const rotinasServiceSpy = jasmine.createSpyObj('RotinasService', ['create', 'update', 'findOne']);
    const pilaresServiceSpy = jasmine.createSpyObj('PilaresService', ['findAll']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [RotinaFormComponent, ReactiveFormsModule],
      providers: [
        { provide: RotinasService, useValue: rotinasServiceSpy },
        { provide: PilaresService, useValue: pilaresServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    rotinasService = TestBed.inject(RotinasService) as jasmine.SpyObj<RotinasService>;
    pilaresService = TestBed.inject(PilaresService) as jasmine.SpyObj<PilaresService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    pilaresService.findAll.and.returnValue(of(mockPilares));

    fixture = TestBed.createComponent(RotinaFormComponent);
    component = fixture.componentInstance;
  });

  // ============================================================
  // Inicialização e DI (inject())
  // ============================================================

  describe('Inicialização e Dependency Injection', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve usar inject() para injetar FormBuilder', () => {
      expect(component['fb']).toBeDefined();
    });

    it('deve usar inject() para injetar RotinasService', () => {
      expect(component['rotinasService']).toBeDefined();
    });

    it('deve usar inject() para injetar PilaresService', () => {
      expect(component['pilaresService']).toBeDefined();
    });

    it('deve usar inject() para injetar Router', () => {
      expect(component['router']).toBeDefined();
    });

    it('deve usar inject() para injetar ActivatedRoute', () => {
      expect(component['route']).toBeDefined();
    });

    it('deve carregar pilares no ngOnInit', () => {
      fixture.detectChanges();

      expect(pilaresService.findAll).toHaveBeenCalled();
      expect(component.pilares.length).toBe(2);
    });
  });

  // ============================================================
  // R-ROT-001: Validações de Formulário
  // ============================================================

  describe('R-ROT-001: Validações de Formulário', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('formulário deve ser inválido quando vazio', () => {
      expect(component.form.valid).toBe(false);
    });

    it('campo nome é obrigatório', () => {
      const nome = component.form.get('nome');
      expect(nome?.hasError('required')).toBe(true);

      nome?.setValue('');
      expect(nome?.hasError('required')).toBe(true);

      nome?.setValue('Rotina Teste');
      expect(nome?.hasError('required')).toBe(false);
    });

    it('nome deve ter minLength de 2 caracteres', () => {
      const nome = component.form.get('nome');
      
      nome?.setValue('A');
      expect(nome?.hasError('minlength')).toBe(true);

      nome?.setValue('AB');
      expect(nome?.hasError('minlength')).toBe(false);
    });

    it('nome deve ter maxLength de 200 caracteres', () => {
      const nome = component.form.get('nome');
      const longName = 'A'.repeat(201);
      
      nome?.setValue(longName);
      expect(nome?.hasError('maxlength')).toBe(true);

      nome?.setValue('A'.repeat(200));
      expect(nome?.hasError('maxlength')).toBe(false);
    });

    it('campo pilarId é obrigatório', () => {
      const pilarId = component.form.get('pilarId');
      expect(pilarId?.hasError('required')).toBe(true);

      pilarId?.setValue('pilar-1');
      expect(pilarId?.hasError('required')).toBe(false);
    });

    it('descricao deve ter maxLength de 500 caracteres', () => {
      const descricao = component.form.get('descricao');
      const longDesc = 'A'.repeat(501);
      
      descricao?.setValue(longDesc);
      expect(descricao?.hasError('maxlength')).toBe(true);

      descricao?.setValue('A'.repeat(500));
      expect(descricao?.hasError('maxlength')).toBe(false);
    });

    it('ordem deve ter min value de 1', () => {
      const ordem = component.form.get('ordem');
      
      ordem?.setValue(0);
      expect(ordem?.hasError('min')).toBe(true);

      ordem?.setValue(-1);
      expect(ordem?.hasError('min')).toBe(true);

      ordem?.setValue(1);
      expect(ordem?.hasError('min')).toBe(false);
    });

    it('modelo deve ser boolean com default false', () => {
      const modelo = component.form.get('modelo');
      expect(modelo?.value).toBe(false);

      modelo?.setValue(true);
      expect(modelo?.value).toBe(true);
    });

    it('formulário deve ser válido com dados corretos', () => {
      component.form.patchValue({
        nome: 'Rotina Teste',
        pilarId: 'pilar-1',
        descricao: 'Descrição opcional',
        ordem: 1,
        modelo: false,
      });

      expect(component.form.valid).toBe(true);
    });
  });

  // ============================================================
  // Modo Criação vs Modo Edição
  // ============================================================

  describe('Modo Criação vs Modo Edição', () => {
    it('deve iniciar em modo criação quando não há ID na rota', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      fixture.detectChanges();

      expect(component.isEditMode).toBe(false);
      expect(component.rotinaId).toBe(null);
    });

    it('deve iniciar em modo edição quando há ID na rota', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('rotina-1');
      rotinasService.findOne.and.returnValue(of(mockRotina));
      fixture.detectChanges();

      expect(component.isEditMode).toBe(true);
      expect(component.rotinaId).toBe('rotina-1');
      expect(rotinasService.findOne).toHaveBeenCalledWith('rotina-1');
    });

    it('deve carregar dados da rotina em modo edição', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('rotina-1');
      rotinasService.findOne.and.returnValue(of(mockRotina));
      fixture.detectChanges();

      expect(component.form.get('nome')?.value).toBe('Planejamento Estratégico');
      expect(component.form.get('descricao')?.value).toBe('Análise SWOT');
      expect(component.form.get('pilarId')?.value).toBe('pilar-1');
      expect(component.form.get('modelo')?.value).toBe(true);
    });
  });

  // ============================================================
  // UI-ROT-005: PilarId Disabled em Edit Mode (PRIORITÁRIO)
  // ============================================================

  describe('UI-ROT-005: PilarId Disabled em Edit Mode - PRIORITÁRIO', () => {
    it('pilarId deve estar habilitado em modo criação', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      fixture.detectChanges();

      const pilarId = component.form.get('pilarId');
      expect(pilarId?.disabled).toBe(false);
    });

    it('pilarId deve estar desabilitado em modo edição', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('rotina-1');
      rotinasService.findOne.and.returnValue(of(mockRotina));
      fixture.detectChanges();

      const pilarId = component.form.get('pilarId');
      expect(pilarId?.disabled).toBe(true);
    });

    it('updateRotina() não deve enviar pilarId no payload', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('rotina-1');
      rotinasService.findOne.and.returnValue(of(mockRotina));
      rotinasService.update.and.returnValue(of(mockRotina));
      fixture.detectChanges();

      component.form.patchValue({
        nome: 'Novo Nome',
        descricao: 'Nova descrição',
        ordem: 2,
        modelo: false,
      });

      spyOn(window, 'alert');
      component.onSubmit();

      const updatePayload = rotinasService.update.calls.mostRecent().args[1];
      expect(updatePayload).not.toHaveProperty('pilarId');
      expect(updatePayload).toEqual({
        nome: 'Novo Nome',
        descricao: 'Nova descrição',
        ordem: 2,
        modelo: false,
      });
    });
  });

  // ============================================================
  // Submit Create (Modo Criação)
  // ============================================================

  describe('Submit - Modo Criação', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      fixture.detectChanges();
    });

    it('deve criar rotina com sucesso', () => {
      const createDto: CreateRotinaDto = {
        nome: 'Nova Rotina',
        pilarId: 'pilar-1',
        descricao: 'Descrição',
        ordem: 1,
        modelo: false,
      };

      component.form.patchValue(createDto);
      rotinasService.create.and.returnValue(of(mockRotina));
      spyOn(window, 'alert');

      component.onSubmit();

      expect(rotinasService.create).toHaveBeenCalledWith(createDto);
      expect(window.alert).toHaveBeenCalledWith('Rotina criada com sucesso');
      expect(router.navigate).toHaveBeenCalledWith(['/rotinas']);
    });

    it('deve fazer trim no nome antes de criar', () => {
      component.form.patchValue({
        nome: '  Rotina com espaços  ',
        pilarId: 'pilar-1',
      });

      rotinasService.create.and.returnValue(of(mockRotina));
      spyOn(window, 'alert');

      component.onSubmit();

      const payload = rotinasService.create.calls.mostRecent().args[0];
      expect(payload.nome).toBe('Rotina com espaços');
    });

    it('deve remover descricao se estiver vazia', () => {
      component.form.patchValue({
        nome: 'Rotina Teste',
        pilarId: 'pilar-1',
        descricao: '   ', // Apenas espaços
      });

      rotinasService.create.and.returnValue(of(mockRotina));
      spyOn(window, 'alert');

      component.onSubmit();

      const payload = rotinasService.create.calls.mostRecent().args[0];
      expect(payload.descricao).toBeUndefined();
    });

    it('não deve submeter se formulário inválido', () => {
      component.form.patchValue({
        nome: '', // Inválido
        pilarId: 'pilar-1',
      });

      component.onSubmit();

      expect(rotinasService.create).not.toHaveBeenCalled();
      expect(component.form.get('nome')?.touched).toBe(true);
    });

    it('deve exibir erro 409 (conflito)', () => {
      component.form.patchValue({
        nome: 'Rotina Duplicada',
        pilarId: 'pilar-1',
      });

      const errorResponse = new HttpErrorResponse({
        error: 'Conflict',
        status: 409,
        statusText: 'Conflict',
      });

      rotinasService.create.and.returnValue(throwError(() => errorResponse));
      component.onSubmit();

      expect(component.error).toBe('Erro de validação. Verifique os dados.');
      expect(component.submitting).toBe(false);
    });

    it('deve exibir erro 400 (bad request)', () => {
      component.form.patchValue({
        nome: 'Rotina Teste',
        pilarId: 'pilar-1',
      });

      const errorResponse = new HttpErrorResponse({
        error: 'Bad Request',
        status: 400,
        statusText: 'Bad Request',
      });

      rotinasService.create.and.returnValue(throwError(() => errorResponse));
      component.onSubmit();

      expect(component.error).toBe('Dados inválidos. Verifique os campos.');
    });
  });

  // ============================================================
  // Submit Update (Modo Edição)
  // ============================================================

  describe('Submit - Modo Edição', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('rotina-1');
      rotinasService.findOne.and.returnValue(of(mockRotina));
      fixture.detectChanges();
    });

    it('deve atualizar rotina com sucesso', () => {
      const updateDto: UpdateRotinaDto = {
        nome: 'Nome Atualizado',
        descricao: 'Descrição Atualizada',
        ordem: 2,
        modelo: false,
      };

      component.form.patchValue(updateDto);
      rotinasService.update.and.returnValue(of(mockRotina));
      spyOn(window, 'alert');

      component.onSubmit();

      expect(rotinasService.update).toHaveBeenCalledWith('rotina-1', updateDto);
      expect(window.alert).toHaveBeenCalledWith('Rotina atualizada com sucesso');
      expect(router.navigate).toHaveBeenCalledWith(['/rotinas']);
    });

    it('deve exibir erro 404 (não encontrada)', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'Not Found',
        status: 404,
        statusText: 'Not Found',
      });

      rotinasService.update.and.returnValue(throwError(() => errorResponse));
      component.onSubmit();

      expect(component.error).toBe('Rotina não encontrada');
    });

    it('deve exibir erro genérico para outros erros', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'Internal Server Error',
        status: 500,
        statusText: 'Internal Server Error',
      });

      rotinasService.update.and.returnValue(throwError(() => errorResponse));
      component.onSubmit();

      expect(component.error).toBe('Erro ao salvar rotina. Tente novamente.');
    });
  });

  // ============================================================
  // Getters de Validação
  // ============================================================

  describe('Validation Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('nomeInvalid deve retornar true quando nome inválido e touched', () => {
      const nome = component.form.get('nome');
      nome?.setValue('');
      nome?.markAsTouched();

      expect(component.nomeInvalid).toBe(true);
    });

    it('nomeInvalid deve retornar false quando nome válido', () => {
      const nome = component.form.get('nome');
      nome?.setValue('Rotina Válida');

      expect(component.nomeInvalid).toBe(false);
    });

    it('pilarIdInvalid deve retornar true quando pilarId inválido e touched', () => {
      const pilarId = component.form.get('pilarId');
      pilarId?.setValue('');
      pilarId?.markAsTouched();

      expect(component.pilarIdInvalid).toBe(true);
    });
  });

  // ============================================================
  // Navegação e Cancelamento
  // ============================================================

  describe('Navegação e Cancelamento', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('cancel() deve navegar para /rotinas', () => {
      component.cancel();

      expect(router.navigate).toHaveBeenCalledWith(['/rotinas']);
    });
  });

  // ============================================================
  // Carregamento de Dados
  // ============================================================

  describe('Carregamento de Dados', () => {
    it('deve carregar pilares ativos apenas', () => {
      const pilaresComInativo: Pilar[] = [
        ...mockPilares,
        { id: 'pilar-3', nome: 'Inativo', modelo: true, ativo: false, ordem: 3 } as Pilar,
      ];

      pilaresService.findAll.and.returnValue(of(pilaresComInativo));
      fixture.detectChanges();

      expect(component.pilares.length).toBe(2); // Apenas ativos
      expect(component.pilares.every(p => p.ativo)).toBe(true);
    });

    it('deve exibir erro ao falhar no carregamento de pilares', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'Internal Server Error',
        status: 500,
        statusText: 'Internal Server Error',
      });

      pilaresService.findAll.and.returnValue(throwError(() => errorResponse));
      fixture.detectChanges();

      expect(component.error).toBe('Erro ao carregar pilares');
    });

    it('deve exibir erro 404 ao carregar rotina inexistente', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('rotina-inexistente');

      const errorResponse = new HttpErrorResponse({
        error: 'Not Found',
        status: 404,
        statusText: 'Not Found',
      });

      rotinasService.findOne.and.returnValue(throwError(() => errorResponse));
      fixture.detectChanges();

      expect(component.error).toBe('Rotina não encontrada');
      expect(component.loading).toBe(false);
    });
  });
});
