import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PilarBadgeComponent } from './pilar-badge.component';

/**
 * QA UNITÁRIO ESTRITO - PilarBadgeComponent (UI-PIL-002)
 * Valida badge de tipo (Padrão vs Customizado)
 */
describe('PilarBadgeComponent - UI-PIL-002', () => {
  let component: PilarBadgeComponent;
  let fixture: ComponentFixture<PilarBadgeComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PilarBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PilarBadgeComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  // ============================================================
  // UI-PIL-002: Badge de Tipo
  // ============================================================

  describe('UI-PIL-002: Badge Padrão vs Customizado', () => {
    it('deve exibir "Padrão" com bg-primary quando modelo=true', () => {
      component.modelo = true;
      fixture.detectChanges();

      expect(component.label).toBe('Padrão');
      expect(component.badgeClass).toBe('badge bg-primary');
    });

    it('deve exibir "Customizado" com bg-secondary quando modelo=false', () => {
      component.modelo = false;
      fixture.detectChanges();

      expect(component.label).toBe('Customizado');
      expect(component.badgeClass).toBe('badge bg-secondary');
    });
  });

  // ============================================================
  // Template Rendering
  // ============================================================

  describe('Template Rendering', () => {
    it('deve renderizar span com classe correta para Padrão', () => {
      component.modelo = true;
      fixture.detectChanges();

      const badge = compiled.querySelector('span');
      expect(badge).toBeTruthy();
      expect(badge?.textContent?.trim()).toBe('Padrão');
      expect(badge?.classList.contains('badge')).toBe(true);
      expect(badge?.classList.contains('bg-primary')).toBe(true);
    });

    it('deve renderizar span com classe correta para Customizado', () => {
      component.modelo = false;
      fixture.detectChanges();

      const badge = compiled.querySelector('span');
      expect(badge).toBeTruthy();
      expect(badge?.textContent?.trim()).toBe('Customizado');
      expect(badge?.classList.contains('badge')).toBe(true);
      expect(badge?.classList.contains('bg-secondary')).toBe(true);
    });

    it('deve aplicar atributo title se fornecido', () => {
      component.modelo = true;
      component.title = 'Pilar padrão (auto-associado)';
      fixture.detectChanges();

      const badge = compiled.querySelector('span');
      expect(badge?.getAttribute('title')).toBe('Pilar padrão (auto-associado)');
    });

    it('não deve ter atributo title se não fornecido', () => {
      component.modelo = true;
      component.title = undefined;
      fixture.detectChanges();

      const badge = compiled.querySelector('span');
      expect(badge?.hasAttribute('title')).toBe(false);
    });
  });

  // ============================================================
  // Input Bindings
  // ============================================================

  describe('@Input bindings', () => {
    it('deve aceitar modelo como @Input', () => {
      component.modelo = true;
      expect(component.modelo).toBe(true);

      component.modelo = false;
      expect(component.modelo).toBe(false);
    });

    it('deve aceitar title como @Input opcional', () => {
      component.title = 'Tooltip personalizado';
      expect(component.title).toBe('Tooltip personalizado');

      component.title = undefined;
      expect(component.title).toBeUndefined();
    });
  });

  // ============================================================
  // Getters Computed
  // ============================================================

  describe('Computed Getters', () => {
    it('get label() deve retornar "Padrão" quando modelo=true', () => {
      component.modelo = true;
      expect(component.label).toBe('Padrão');
    });

    it('get label() deve retornar "Customizado" quando modelo=false', () => {
      component.modelo = false;
      expect(component.label).toBe('Customizado');
    });

    it('get badgeClass() deve retornar "badge bg-primary" quando modelo=true', () => {
      component.modelo = true;
      expect(component.badgeClass).toBe('badge bg-primary');
    });

    it('get badgeClass() deve retornar "badge bg-secondary" quando modelo=false', () => {
      component.modelo = false;
      expect(component.badgeClass).toBe('badge bg-secondary');
    });
  });

  // ============================================================
  // Reusabilidade
  // ============================================================

  describe('Reusabilidade', () => {
    it('deve ser standalone component', () => {
      expect(component).toBeTruthy();
      // Standalone components podem ser importados diretamente
    });

    it('deve atualizar UI quando @Input muda', () => {
      component.modelo = true;
      fixture.detectChanges();

      let badge = compiled.querySelector('span');
      expect(badge?.textContent?.trim()).toBe('Padrão');

      component.modelo = false;
      fixture.detectChanges();

      badge = compiled.querySelector('span');
      expect(badge?.textContent?.trim()).toBe('Customizado');
    });

    it('deve ser reutilizável em múltiplos contextos', () => {
      const scenarios = [
        { modelo: true, expectedLabel: 'Padrão', expectedClass: 'bg-primary' },
        { modelo: false, expectedLabel: 'Customizado', expectedClass: 'bg-secondary' },
      ];

      scenarios.forEach((scenario) => {
        component.modelo = scenario.modelo;
        fixture.detectChanges();

        expect(component.label).toBe(scenario.expectedLabel);
        expect(component.badgeClass).toContain(scenario.expectedClass);
      });
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('deve lidar com mudanças rápidas de modelo', () => {
      component.modelo = true;
      fixture.detectChanges();
      expect(component.label).toBe('Padrão');

      component.modelo = false;
      fixture.detectChanges();
      expect(component.label).toBe('Customizado');

      component.modelo = true;
      fixture.detectChanges();
      expect(component.label).toBe('Padrão');
    });

    it('deve lidar com title vazio', () => {
      component.modelo = true;
      component.title = '';
      fixture.detectChanges();

      const badge = compiled.querySelector('span');
      expect(badge?.getAttribute('title')).toBe('');
    });

    it('deve manter consistência entre label e badgeClass', () => {
      component.modelo = true;
      expect(component.label).toBe('Padrão');
      expect(component.badgeClass).toContain('bg-primary');

      component.modelo = false;
      expect(component.label).toBe('Customizado');
      expect(component.badgeClass).toContain('bg-secondary');
    });
  });

  // ============================================================
  // Spec Conformance (pilares.md UI-PIL-002)
  // ============================================================

  describe('Conformance com pilares.md', () => {
    it('modelo=true deve renderizar badge "Padrão" (cor primária azul)', () => {
      component.modelo = true;
      fixture.detectChanges();

      const badge = compiled.querySelector('span');
      expect(badge?.textContent?.trim()).toBe('Padrão');
      expect(badge?.classList.contains('bg-primary')).toBe(true);
    });

    it('modelo=false deve renderizar badge "Customizado" (cor secundária cinza)', () => {
      component.modelo = false;
      fixture.detectChanges();

      const badge = compiled.querySelector('span');
      expect(badge?.textContent?.trim()).toBe('Customizado');
      expect(badge?.classList.contains('bg-secondary')).toBe(true);
    });

    it('componente deve ser reutilizável em toda aplicação', () => {
      // Teste de integração conceitual: componente pode ser usado em:
      // - PilaresListComponent (listagem)
      // - PilaresFormComponent (visualização)
      // - Outros contextos futuros
      expect(component).toBeTruthy();
    });
  });
});
