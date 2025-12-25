import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-rotina-badge',
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
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      display: inline-block;
    }
  `]
})
export class RotinaBadgeComponent {
  @Input() modelo: boolean = false;
  @Input() title?: string;

  get label(): string {
    return this.modelo ? 'Modelo' : 'Customizada';
  }

  get badgeClass(): string {
    return this.modelo ? 'badge bg-primary' : 'badge bg-secondary';
  }

  get tooltipText(): string {
    if (this.title) {
      return this.title;
    }
    return this.modelo
      ? 'Rotina padrão do sistema'
      : 'Rotina customizada';
  }
}
