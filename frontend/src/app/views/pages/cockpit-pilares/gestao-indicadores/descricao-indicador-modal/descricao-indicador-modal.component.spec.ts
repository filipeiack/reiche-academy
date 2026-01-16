import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DescricaoIndicadorModalComponent } from './descricao-indicador-modal.component';

describe('DescricaoIndicadorModalComponent', () => {
  let component: DescricaoIndicadorModalComponent;
  let fixture: ComponentFixture<DescricaoIndicadorModalComponent>;
  let mockActiveModal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    mockActiveModal = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      imports: [DescricaoIndicadorModalComponent, FormsModule],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DescricaoIndicadorModalComponent);
    component = fixture.componentInstance;
    component.nomeIndicador = 'Test Indicator';
    component.descricao = 'Test Description';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with provided description', () => {
    component.ngOnInit();
    expect(component.descricaoAtual).toBe('Test Description');
  });

  it('should initialize with empty string if description is null', () => {
    component.descricao = null;
    component.ngOnInit();
    expect(component.descricaoAtual).toBe('');
  });

  it('should close modal with trimmed description on save', () => {
    component.descricaoAtual = '  New Description  ';
    component.salvar();
    expect(mockActiveModal.close).toHaveBeenCalledWith('New Description');
  });

  it('should close modal with null if description is empty on save', () => {
    component.descricaoAtual = '   ';
    component.salvar();
    expect(mockActiveModal.close).toHaveBeenCalledWith(null);
  });

  it('should dismiss modal on cancel', () => {
    component.cancelar();
    expect(mockActiveModal.dismiss).toHaveBeenCalled();
  });
});
