import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

/**
 * Componente genérico para exibir badges de modelo/customização
 * Usado para pilares, rotinas e outros recursos que podem ser padrão ou customizados
 */
@Component({
  selector: 'app-modelo-badge',
  standalone: true,
  imports: [NgClass, NgbTooltip],
  template: `
    <span
      [ngClass]="badgeClass"
      [ngbTooltip]="tooltipText"
      placement="top"
    >
      {{ label }}
    </span>
  `,
  styles: [`
    span {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 0.25rem;
    }
  `]
})
export class ModeloBadgeComponent {
  @Input() modelo: boolean = false;
  @Input() title?: string;

  get label(): string {
    return this.modelo ? 'Padrão' : 'Customizado';
  }

  get badgeClass(): string {
    return this.modelo ? 'badge bg-primary' : 'badge bg-secondary';
  }

  get tooltipText(): string {
    if (this.title) {
      return this.title;
    }
    return this.modelo
      ? 'Padrão do sistema'
      : 'Customizado';
  }
}
