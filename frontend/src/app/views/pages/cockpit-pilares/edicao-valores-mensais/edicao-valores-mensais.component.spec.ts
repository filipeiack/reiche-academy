import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EdicaoValoresMensaisComponent } from './edicao-valores-mensais.component';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { of, throwError } from 'rxjs';

describe('EdicaoValoresMensaisComponent', () => {
  let component: EdicaoValoresMensaisComponent;
  let fixture: ComponentFixture<EdicaoValoresMensaisComponent>;
  let mockCockpitService: jasmine.SpyObj<CockpitPilaresService>;

  beforeEach(async () => {
    mockCockpitService = jasmine.createSpyObj('CockpitPilaresService', [
      'getCockpitById',
      'updateValoresMensais',
    ]);

    await TestBed.configureTestingModule({
      imports: [EdicaoValoresMensaisComponent],
      providers: [{ provide: CockpitPilaresService, useValue: mockCockpitService }],
    }).compileComponents();

    fixture = TestBed.createComponent(EdicaoValoresMensaisComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load indicadores on init', (done) => {
    const mockCockpit = {
      id: 'cockpit-1',
      indicadores: [
        {
          id: 'ind-1',
          nome: 'Faturamento',
          melhor: 'MAIOR',
          mesesIndicador: [],
        },
      ],
    };

    mockCockpitService.getCockpitById.and.returnValue(of(mockCockpit as any));
    component.cockpitId = 'cockpit-1';

    component.ngOnInit();

    setTimeout(() => {
      expect(component.indicadores.length).toBe(1);
      expect(component.loading).toBeFalse();
      done();
    }, 100);
  });

  it('should handle error when loading indicadores', (done) => {
    mockCockpitService.getCockpitById.and.returnValue(
      throwError(() => new Error('Network error'))
    );
    component.cockpitId = 'cockpit-1';

    spyOn(console, 'error');

    component.ngOnInit();

    setTimeout(() => {
      expect(console.error).toHaveBeenCalled();
      expect(component.loading).toBeFalse();
      done();
    }, 100);
  });

  it('should calculate desvio correctly for MAIOR', () => {
    const indicador = { melhor: 'MAIOR' } as any;
    const mes = { meta: 100, realizado: 120 } as any;

    const desvio = component.calcularDesvio(indicador, mes);

    expect(desvio).toBe(20);
  });

  it('should calculate status correctly', () => {
    const indicador = { melhor: 'MAIOR' } as any;
    const mesSuccess = { meta: 100, realizado: 110 } as any;
    const mesWarning = { meta: 100, realizado: 85 } as any;
    const mesDanger = { meta: 100, realizado: 50 } as any;

    expect(component.calcularStatus(indicador, mesSuccess)).toBe('success');
    expect(component.calcularStatus(indicador, mesWarning)).toBe('warning');
    expect(component.calcularStatus(indicador, mesDanger)).toBe('danger');
  });

  it('should have public reload method', () => {
    mockCockpitService.getCockpitById.and.returnValue(of({ indicadores: [] } as any));
    component.cockpitId = 'cockpit-1';

    expect(typeof component.reload).toBe('function');

    component.reload();

    expect(mockCockpitService.getCockpitById).toHaveBeenCalled();
  });
});
