# ModeloBadgeComponent

Componente Angular standalone unificado para exibir badges de modelo/customização.

## Descrição

Este componente substitui os antigos `PilarBadgeComponent` e `RotinaBadgeComponent`, fornecendo uma solução única e reutilizável para exibir badges que indicam se um recurso é padrão do sistema ou customizado.

## Funcionalidades

- **Tooltips**: Suporta tooltips customizados usando ngbTooltip
- **Visual consistente**: Badges com cores padronizadas (primary para padrão, secondary para customizado)
- **Standalone**: Não requer módulo adicional

## Uso

### Importação

```typescript
import { ModeloBadgeComponent } from './shared/components/modelo-badge/modelo-badge.component';

@Component({
  // ...
  imports: [ModeloBadgeComponent]
})
```

### Template

```html
<!-- Uso básico -->
<app-modelo-badge [modelo]="pilar.modelo"></app-modelo-badge>

<!-- Com tooltip customizado -->
<app-modelo-badge 
  [modelo]="pilar.modelo"
  [title]="'Pilar padrão (auto-associado a novas empresas)'">
</app-modelo-badge>
```

## Inputs

| Input | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `modelo` | `boolean` | `false` | Indica se é modelo padrão (true) ou customizado (false) |
| `title` | `string?` | - | Texto customizado para o tooltip. Se não fornecido, usa texto padrão |

## Comportamento

### Labels
- **Padrão**: "Padrão"
- **Customizado**: "Customizado"

### Classes CSS
- **Modelo padrão**: `badge bg-primary`
- **Modelo customizado**: `badge bg-secondary`

### Tooltips
- Se `title` for fornecido, usa o valor customizado
- Se `title` for omitido, usa texto padrão

## Migração

Este componente substitui:
- `app-pilar-badge` → `app-modelo-badge`
- `app-rotina-badge` → `app-modelo-badge`

## Testes

O componente possui cobertura completa de testes unitários incluindo:
- Renderização de labels corretos
- Aplicação de classes CSS apropriadas
- Comportamento de tooltips
