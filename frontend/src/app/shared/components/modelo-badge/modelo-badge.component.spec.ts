import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModeloBadgeComponent } from './modelo-badge.component';

/**
 * QA UNITÁRIO ESTRITO - ModeloBadgeComponent
 * Componente unificado para badges de modelo/customização
 */
describe('ModeloBadgeComponent', () => {
  let component: ModeloBadgeComponent;
  let fixture: ComponentFixture<ModeloBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeloBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModeloBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Gênero Masculino (padrão)', () => {
    it('should display "Padrão" when modelo is true', () => {
      component.modelo = true;
      expect(component.label).toBe('Padrão');
    });

    it('should display "Customizado" when modelo is false', () => {
      component.modelo = false;
      expect(component.label).toBe('Customizado');
    });

    it('should apply primary badge class when modelo is true', () => {
      component.modelo = true;
      expect(component.badgeClass).toBe('badge bg-primary');
    });

    it('should apply secondary badge class when modelo is false', () => {
      component.modelo = false;
      expect(component.badgeClass).toBe('badge bg-secondary');
    });

    it('should use custom title when provided', () => {
      component.title = 'Custom tooltip text';
      expect(component.tooltipText).toBe('Custom tooltip text');
    });

    it('should use default tooltip for modelo=true when title not provided', () => {
      component.modelo = true;
      component.title = undefined;
      expect(component.tooltipText).toBe('Padrão do sistema');
    });

    it('should use default tooltip for modelo=false when title not provided', () => {
      component.modelo = false;
      component.title = undefined;
      expect(component.tooltipText).toBe('Customizado');
    });
  });

  
  describe('Template rendering', () => {
    it('should render badge with correct label', () => {
      component.modelo = true;
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('span');
      expect(badge.textContent.trim()).toBe('Padrão');
    });

    it('should apply correct CSS classes', () => {
      component.modelo = true;
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('span');
      expect(badge.classList.contains('badge')).toBe(true);
      expect(badge.classList.contains('bg-primary')).toBe(true);
    });
  });
});
