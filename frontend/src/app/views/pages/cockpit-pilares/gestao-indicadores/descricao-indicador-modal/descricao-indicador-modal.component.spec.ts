import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DescricaoIndicadorModalComponent } from './descricao-indicador-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

describe('DescricaoIndicadorModalComponent', () => {
  let component: DescricaoIndicadorModalComponent;
  let fixture: ComponentFixture<DescricaoIndicadorModalComponent>;
  let mockModalService: jasmine.SpyObj<NgbModal>;

  beforeEach(async () => {
    mockModalService = jasmine.createSpyObj('NgbModal', ['open']);

    await TestBed.configureTestingModule({
      imports: [DescricaoIndicadorModalComponent],
      providers: [
        { provide: NgbModal, useValue: mockModalService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DescricaoIndicadorModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open modal with initial description', () => {
    const mockModalRef = { close: jasmine.createSpy('close') };
    mockModalService.open.and.returnValue(mockModalRef as any);

    component.open('Test Description', 'Test Indicator');

    expect(component.descricao).toBe('Test Description');
    expect(component.indicadorNome).toBe('Test Indicator');
    expect(mockModalService.open).toHaveBeenCalled();
  });

  it('should emit description on save', (done) => {
    const testDescription = 'Updated Description';
    component.descricao = testDescription;

    component.descricaoSalva.subscribe((descricao) => {
      expect(descricao).toBe(testDescription);
      done();
    });

    component.salvar();
  });

  it('should trim description on save', (done) => {
    component.descricao = '  Trimmed Description  ';

    component.descricaoSalva.subscribe((descricao) => {
      expect(descricao).toBe('Trimmed Description');
      done();
    });

    component.salvar();
  });
});
