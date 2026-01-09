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
    // span {
    //   display: inline-block;
    //   padding: 0.25rem 0.5rem;
    //   font-size: 0.8rem;
    //   font-weight: 600;
    //   border-radius: 0.25rem;
    // }
  `]
})
export class MediaBadgeComponent {
  @Input() media: number = 0;
  @Input() title?: string;
  @Input() justMedia?: boolean = false;

  get label(): string {
    return this.justMedia ? this.labelMedia : `MÉDIA DO PILAR: ${this.media.toFixed(1)}`;
  }

  get labelMedia(): string {
    return ` ${this.media.toFixed(1)} `;
  }

  get badgeClass(): string {
    if (this.media >= 8) {
      return 'badge bg-success text-white';
    } else if (this.media >= 6) {
      return 'badge bg-warning text-white';
    } else {
      return 'badge bg-danger text-white';
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
