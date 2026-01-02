import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaBadgeComponent } from './media-badge.component';

/**
 * QA UNITÁRIO ESTRITO - MediaBadgeComponent
 */
describe('MediaBadgeComponent', () => {
  let component: MediaBadgeComponent;
  let fixture: ComponentFixture<MediaBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Label', () => {
    it('should display media with one decimal place', () => {
      component.media = 7.5;
      expect(component.label).toBe('Média: 7.5');
    });

    it('should format whole numbers with one decimal', () => {
      component.media = 8;
      expect(component.label).toBe('Média: 8.0');
    });

    it('should round to one decimal place', () => {
      component.media = 7.567;
      expect(component.label).toBe('Média: 7.6');
    });
  });

  describe('Badge Class - Verde (8 a 10)', () => {
    it('should apply success class for media 10', () => {
      component.media = 10;
      expect(component.badgeClass).toBe('badge bg-success text-white');
    });

    it('should apply success class for media 8', () => {
      component.media = 8;
      expect(component.badgeClass).toBe('badge bg-success text-white');
    });

    it('should apply success class for media 9.5', () => {
      component.media = 9.5;
      expect(component.badgeClass).toBe('badge bg-success text-white');
    });
  });

  describe('Badge Class - Amarelo (6 a 8)', () => {
    it('should apply warning class for media 7', () => {
      component.media = 7;
      expect(component.badgeClass).toBe('badge bg-warning text-dark');
    });

    it('should apply warning class for media 6', () => {
      component.media = 6;
      expect(component.badgeClass).toBe('badge bg-warning text-dark');
    });

    it('should apply warning class for media 7.9', () => {
      component.media = 7.9;
      expect(component.badgeClass).toBe('badge bg-warning text-dark');
    });
  });

  describe('Badge Class - Vermelho (abaixo de 6)', () => {
    it('should apply danger class for media 5', () => {
      component.media = 5;
      expect(component.badgeClass).toBe('badge bg-danger text-white');
    });

    it('should apply danger class for media 0', () => {
      component.media = 0;
      expect(component.badgeClass).toBe('badge bg-danger text-white');
    });

    it('should apply danger class for media 5.9', () => {
      component.media = 5.9;
      expect(component.badgeClass).toBe('badge bg-danger text-white');
    });

    it('should apply danger class for media 1', () => {
      component.media = 1;
      expect(component.badgeClass).toBe('badge bg-danger text-white');
    });
  });

  describe('Tooltip Text', () => {
    it('should use custom title when provided', () => {
      component.title = 'Tooltip customizado';
      component.media = 7;
      expect(component.tooltipText).toBe('Tooltip customizado');
    });

    it('should show "Média excelente" for media >= 8', () => {
      component.media = 9;
      component.title = undefined;
      expect(component.tooltipText).toBe('Média excelente (8 a 10)');
    });

    it('should show "Média regular" for media >= 6 and < 8', () => {
      component.media = 7;
      component.title = undefined;
      expect(component.tooltipText).toBe('Média regular (6 a 8)');
    });

    it('should show "Média crítica" for media < 6', () => {
      component.media = 4;
      component.title = undefined;
      expect(component.tooltipText).toBe('Média crítica (abaixo de 6)');
    });
  });

  describe('Template rendering', () => {
    it('should render badge with correct label', () => {
      component.media = 8.5;
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('span');
      expect(badge.textContent.trim()).toBe('Média: 8.5');
    });

    it('should apply correct CSS classes for high media', () => {
      component.media = 9;
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('span');
      expect(badge.classList.contains('badge')).toBe(true);
      expect(badge.classList.contains('bg-success')).toBe(true);
      expect(badge.classList.contains('text-white')).toBe(true);
    });

    it('should apply correct CSS classes for medium media', () => {
      component.media = 7;
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('span');
      expect(badge.classList.contains('badge')).toBe(true);
      expect(badge.classList.contains('bg-warning')).toBe(true);
      expect(badge.classList.contains('text-dark')).toBe(true);
    });

    it('should apply correct CSS classes for low media', () => {
      component.media = 4;
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('span');
      expect(badge.classList.contains('badge')).toBe(true);
      expect(badge.classList.contains('bg-danger')).toBe(true);
      expect(badge.classList.contains('text-white')).toBe(true);
    });
  });
});
