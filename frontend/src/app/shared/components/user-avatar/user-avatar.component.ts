import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InitialsPipe } from '../../../core/pipes/initials.pipe';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule, InitialsPipe],
  template: `
    <div [class]="'user-avatar ' + sizeClass" [style.background-color]="backgroundColor">
      @if (fotoUrl) {
        <img 
          [src]="fotoUrl" 
          [alt]="nome || 'Avatar'"
          class="avatar-image"
          (error)="onImageError()"
        />
      } @else {
        <span class="avatar-initials">{{ nome | initials }}</span>
      }
    </div>
  `,
  styles: [`
    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: bold;
      flex-shrink: 0;
      overflow: hidden;
      background-color: #e9ecef;
      color: #495057;
    }

    .user-avatar.small {
      width: 30px;
      height: 30px;
      font-size: 12px;
    }

    .user-avatar.medium {
      width: 50px;
      height: 50px;
      font-size: 18px;
    }

    .user-avatar.large {
      width: 80px;
      height: 80px;
      font-size: 28px;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  `]
})
export class UserAvatarComponent {
  @Input() nome: string | null | undefined;
  @Input() fotoUrl: string | null | undefined;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  private colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52C4A1'
  ];

  backgroundColor: string;
  get sizeClass(): string {
    return this.size;
  }

  constructor() {
    this.backgroundColor = this.getColorFromName(this.nome);
  }

  ngOnInit(): void {
    this.backgroundColor = this.getColorFromName(this.nome);
  }

  private getColorFromName(name: string | null | undefined): string {
    if (!name) return '#e9ecef';
    
    // Usa o código do primeiro caractere para selecionar uma cor consistente
    const charCode = name.charCodeAt(0);
    const index = charCode % this.colors.length;
    return this.colors[index];
  }

  onImageError(): void {
    // Se a imagem falhar ao carregar, limpa a fotoUrl para mostrar iniciais
    this.fotoUrl = null;
  }
}
