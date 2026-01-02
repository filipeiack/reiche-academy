# MediaBadgeComponent

Componente Angular standalone para exibir badge de média de notas com cores baseadas no valor.

## Descrição

Este componente exibe a média de notas com cores que indicam o nível de desempenho, sendo útil para visualização rápida de médias em dashboards e listagens.

## Funcionalidades

- **Cores dinâmicas**: Cores diferentes baseadas no valor da média
  - Verde (8 a 10): Média excelente
  - Amarelo (6 a 8): Média regular
  - Vermelho (abaixo de 6): Média crítica
- **Tooltips**: Mostra informações adicionais ao passar o mouse
- **Formatação**: Exibe a média com 1 casa decimal
- **Standalone**: Não requer módulo adicional

## Uso

### Importação

```typescript
import { MediaBadgeComponent } from './shared/components/media-badge/media-badge.component';

@Component({
  // ...
  imports: [MediaBadgeComponent]
})
```

### Template

```html
<!-- Uso básico -->
<app-media-badge [media]="7.5"></app-media-badge>

<!-- Com tooltip customizado -->
<app-media-badge 
  [media]="getPilarMediaNotas(pilar)"
  [title]="'Média de notas do pilar'">
</app-media-badge>
```

## Inputs

| Input | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `media` | `number` | `0` | Valor da média de notas |
| `title` | `string?` | - | Texto customizado para o tooltip. Se não fornecido, usa texto padrão baseado na faixa de valor |

## Comportamento

### Labels
- Formato: "Média: X.X" (uma casa decimal)

### Classes CSS e Cores
- **Média >= 8**: `badge bg-success text-white` (Verde)
- **Média >= 6 e < 8**: `badge bg-warning text-dark` (Amarelo)
- **Média < 6**: `badge bg-danger text-white` (Vermelho)

### Tooltips Padrão
- **Média >= 8**: "Média excelente (8 a 10)"
- **Média >= 6 e < 8**: "Média regular (6 a 8)"
- **Média < 6**: "Média crítica (abaixo de 6)"

## Exemplo de Uso

### Em Diagnóstico de Notas

```typescript
// Component
getPilarMediaNotas(pilar: PilarEmpresa): number {
  if (!pilar.rotinasEmpresa || pilar.rotinasEmpresa.length === 0) {
    return 0;
  }

  const rotinasComNota = pilar.rotinasEmpresa.filter(rotina => {
    const nota = this.getNotaAtual(rotina);
    return nota !== null && nota !== undefined;
  });

  if (rotinasComNota.length === 0) {
    return 0;
  }

  const somaNotas = rotinasComNota.reduce((soma, rotina) => {
    const nota = this.getNotaAtual(rotina) || 0;
    return soma + nota;
  }, 0);

  return somaNotas / rotinasComNota.length;
}
```

```html
<!-- Template -->
<app-media-badge [media]="getPilarMediaNotas(pilar)"></app-media-badge>
```

## Testes

O componente possui cobertura completa de testes unitários incluindo:
- Formatação de labels com uma casa decimal
- Aplicação correta de classes CSS para cada faixa de valor
- Geração de tooltips padrão e customizados
- Renderização do template
