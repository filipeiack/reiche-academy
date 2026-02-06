import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

/**
 * Componente para exibir badge de média de notas com cores baseadas no valor
 * Verde: 8 a 10
 * Amarelo: 6 a 8
 * Vermelho: abaixo de 6
 */
@Component({
  selector: 'app-media-badge',
  standalone: true,
  imports: [CommonModule, NgbTooltip],
  template: `
    <span 
      [class]="badgeClass"
      [ngbTooltip]="tooltipText"
      placement="top">
      {{ label }}
    </span>
  `,
  styles: [`
   /* Classes badges para span */
span.bg-danger {
  background-color: var(--bs-danger-bg-subtle) !important;
  border-color: var(--bs-danger) !important;
  border: 1px solid;
  color: var(--bs-body-color);
}

span.bg-warning {
  background-color: var(--bs-warning-bg-subtle) !important;
  border-color: var(--bs-warning) !important;
  border: 1px solid;
  color: var(--bs-body-color);
}

span.bg-success {
  background-color: var(--bs-success-bg-subtle) !important;
  border-color: var(--bs-success) !important;
  border: 1px solid;
  color: var(--bs-body-color);
}
   
  `]
})
export class MediaBadgeComponent {
  @Input() media: number = 0;
  @Input() title?: string;
  @Input() justMedia?: boolean = false;

  get label(): string {
    return this.justMedia ? this.labelMedia : `MÉDIA DO PILAR: ${this.media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
  }

  get labelMedia(): string {
    return ` ${this.media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} `;
  }

  get badgeClass(): string {
    if (this.media >= 8) {
      return 'badge bg-success text-black';
    } else if (this.media >= 6) {
      return 'badge bg-warning text-black';
    } else {
      return 'badge bg-danger text-black';
    }
  }

  get tooltipText(): string {
    if (this.title) {
      return this.title;
    }
    
    if (this.media >= 8) {
      return 'Média excelente (8 a 10)';
    } else if (this.media >= 6) {
      return 'Média regular (6 a 8)';
    } else {
      return 'Média crítica (abaixo de 6)';
    }
  }
}
