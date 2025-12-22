import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pilar-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      [class]="badgeClass"
      [attr.title]="title">
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
export class PilarBadgeComponent {
  @Input() modelo: boolean = false;
  @Input() title?: string;

  get label(): string {
    return this.modelo ? 'Padrão' : 'Customizado';
  }

  get badgeClass(): string {
    return this.modelo ? 'badge bg-primary' : 'badge bg-secondary';
  }
}
