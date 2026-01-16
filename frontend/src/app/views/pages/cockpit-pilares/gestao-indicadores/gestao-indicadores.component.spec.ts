import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestaoIndicadoresComponent } from './gestao-indicadores.component';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { UsersService } from '@core/services/users.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import { DescricaoIndicadorModalComponent } from './descricao-indicador-modal/descricao-indicador-modal.component';

describe('GestaoIndicadoresComponent', () => {
  let component: GestaoIndicadoresComponent;
  let fixture: ComponentFixture<GestaoIndicadoresComponent>;
  let mockCockpitService: jasmine.SpyObj<CockpitPilaresService>;
  let mockUsuarioService: jasmine.SpyObj<UsersService>;
  let mockModalService: jasmine.SpyObj<NgbModal>;

  beforeEach(async () => {
    mockCockpitService = jasmine.createSpyObj('CockpitPilaresService', [
      'getCockpitById',
      'createIndicador',
      'updateIndicador',
      'deleteIndicador',
      'updateIndicadoresOrdem',
    ]);

    mockUsuarioService = jasmine.createSpyObj('UsersService', [
      'getAll',
    ]);

    mockModalService = jasmine.createSpyObj('NgbModal', ['open']);

    await TestBed.configureTestingModule({
      imports: [GestaoIndicadoresComponent],
      providers: [
        { provide: CockpitPilaresService, useValue: mockCockpitService },
        { provide: UsersService, useValue: mockUsuarioService },
        { provide: NgbModal, useValue: mockModalService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GestaoIndicadoresComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load indicadores on init', (done) => {
    const mockCockpit = {
      id: 'cockpit-1',
      indicadores: [{ id: 'ind-1', nome: 'Faturamento', ordem: 1 }],
    };

    mockCockpitService.getCockpitById.and.returnValue(of(mockCockpit as any));
    mockUsuarioService.getAll.and.returnValue(of([]));
    component.cockpitId = 'cockpit-1';

    component.ngOnInit();

    setTimeout(() => {
      expect(component.indicadores.length).toBe(1);
      expect(component.loading).toBeFalse();
      done();
    }, 100);
  });

  it('should add new row correctly', () => {
    component.indicadores = [];

    component.addNewRow();

    expect(component.indicadores.length).toBe(1);
    expect(component.indicadores[0].isNew).toBeTrue();
    expect(component.indicadores[0].isEditing).toBeTrue();
  });

  it('should validate required fields', () => {
    const indicador = {
      id: '',
      nome: 'Faturamento',
      tipoMedida: 'REAL',
      melhor: 'MAIOR',
    } as any;

    expect(component.isValidForSave(indicador)).toBeTrue();

    indicador.nome = '';
    expect(component.isValidForSave(indicador)).toBeFalse();
  });

  it('should emit indicadorCriado event on create', (done) => {
    const newIndicador = { id: 'ind-1', nome: 'Novo' };
    mockCockpitService.createIndicador.and.returnValue(of(newIndicador as any));

    spyOn(component.indicadorCriado, 'emit');

    component.cockpitId = 'cockpit-1';
    component.indicadores = [
      {
        id: '',
        nome: 'Novo',
        tipoMedida: 'REAL',
        melhor: 'MAIOR',
        isNew: true,
      } as any,
    ];

    component['saveIndicador'](component.indicadores[0]);

    setTimeout(() => {
      expect(component.indicadorCriado.emit).toHaveBeenCalledWith(newIndicador as any);
      done();
    }, 100);
  });

  it('should emit indicadorRemovido event on delete', (done) => {
    mockCockpitService.deleteIndicador.and.returnValue(of(null as any));

    spyOn(component.indicadorRemovido, 'emit');
    spyOn(window, 'confirm').and.returnValue(true);

    component.indicadores = [{ id: 'ind-1', nome: 'Teste', isNew: false } as any];

    component.deleteIndicador(component.indicadores[0]);

    setTimeout(() => {
      expect(component.indicadorRemovido.emit).toHaveBeenCalledWith('ind-1');
      done();
    }, 100);
  });

  it('should toggle melhor direction', () => {
    const indicador = { melhor: 'MAIOR' } as any;

    component.toggleMelhor(indicador);

    expect(indicador.melhor).toBe('MENOR');

    component.toggleMelhor(indicador);

    expect(indicador.melhor).toBe('MAIOR');
  });

  it('should open description modal', () => {
    const indicador = { 
      nome: 'Test Indicador', 
      descricao: 'Test Description',
      id: 'ind-1'
    } as any;
    
    component.descricaoModal = jasmine.createSpyObj('DescricaoIndicadorModalComponent', ['open']);
    
    component.openDescricaoModal(indicador);
    
    expect(component.descricaoModal.open).toHaveBeenCalledWith('Test Description', 'Test Indicador');
  });
});
