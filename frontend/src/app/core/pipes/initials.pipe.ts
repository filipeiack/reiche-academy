import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initials',
  standalone: true
})
export class InitialsPipe implements PipeTransform {
  transform(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return '?';
    }

    const parts = name.trim().split(' ');
    
    if (parts.length === 1) {
      // Se tiver só um nome, pega a primeira letra
      return parts[0].charAt(0).toUpperCase();
    }

    // Se tiver múltiplas partes, pega a primeira letra do primeiro e último nome
    const firstLetter = parts[0].charAt(0).toUpperCase();
    const lastLetter = parts[parts.length - 1].charAt(0).toUpperCase();
    
    return `${firstLetter}${lastLetter}`;
  }
}
