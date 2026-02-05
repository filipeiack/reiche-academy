# Sortable Directive Guide

Documentação completa para usar a diretiva `SortableDirective` em tabelas.

## 📍 Localização

```
src/app/shared/directives/sortable.directive.ts
```

## 🎯 Objetivo

A diretiva `SortableDirective` permite tornar headers de tabelas ordenáveis com:
- Indicadores visuais de ordem (▲/▼)
- Ciclo de ordenação (asc → desc → none)
- Emissão de eventos para o componente pai

## 📦 Instalação/Import

### 1. Declarar no Componente
```typescript
import { SortableDirective } from '@app/shared/directives/sortable.directive';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SortableDirective,  // ← Adicionar aqui
    NgbAlertModule
  ],
  templateUrl: './usuarios-list.component.html'
})
export class UsuariosListComponent {
  // ...
}
```

### 2. Usar no Template
```html
<table class="table table-hover">
  <thead>
    <tr>
      <th sortable="name" (sort)="onSort($event)">Nome</th>
      <th sortable="email" (sort)="onSort($event)">Email</th>
      <th>Ações</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let user of users">
      <td>{{ user.name }}</td>
      <td>{{ user.email }}</td>
    </tr>
  </tbody>
</table>
```

## 🔧 API

### @Directive
```typescript
@Directive({
  selector: 'th[sortable]',      // Aplica em <th sortable="...">
  standalone: true
})
```

### @Input
```typescript
@Input() sortable: string = '';   // Nome da coluna a ordenar
```

### @Output
```typescript
@Output() sort = new EventEmitter<SortEvent>();
```

### Interface SortEvent
```typescript
export interface SortEvent {
  column: string;                 // Nome da coluna
  direction: 'asc' | 'desc' | ''; // Direção ou vazio para limpar
}
```

### HostBinding
```typescript
@HostBinding('class.asc') asc = false;      // Adiciona class "asc"
@HostBinding('class.desc') desc = false;    // Adiciona class "desc"
```

### Métodos Públicos
```typescript
rotate(): void {
  // Cicla: '' → 'asc' → 'desc' → ''
  // Atualiza HostBinding e emite evento
}
```

## 💻 Exemplo Completo

### Template (HTML)
```html
<div class="table-responsive">
  <table class="table table-hover">
    <thead>
      <tr>
        <th sortable="name" (sort)="onSort($event)">
          Nome
        </th>
        <th sortable="email" (sort)="onSort($event)">
          Email
        </th>
        <th sortable="status" (sort)="onSort($event)">
          Status
        </th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let user of filteredUsuarios; trackBy: trackByUserId">
        <td>{{ user.name }}</td>
        <td>{{ user.email }}</td>
        <td>
          <span class="badge" [class.bg-success]="user.status === 'active'">
            {{ user.status }}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-danger">Deletar</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Componente (TypeScript)
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  SortableDirective, 
  SortEvent 
} from '@app/shared/directives/sortable.directive';

interface Usuario {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SortableDirective],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss'
})
export class UsuariosListComponent implements OnInit {
  usuarios: Usuario[] = [];
  filteredUsuarios: Usuario[] = [];
  
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    // Carregar usuários do backend
    this.usuarios = [
      { id: '1', name: 'Ana Silva', email: 'ana@example.com', status: 'active' },
      { id: '2', name: 'Bruno Costa', email: 'bruno@example.com', status: 'active' },
      { id: '3', name: 'Carlos Oliveira', email: 'carlos@example.com', status: 'inactive' }
    ];
    this.filteredUsuarios = [...this.usuarios];
  }

  onSort(event: SortEvent): void {
    // Atualizar estado de ordenação
    this.sortColumn = event.column;
    this.sortDirection = event.direction || 'asc';
    
    // Aplicar ordenação
    this.applySorting();
  }

  applySorting(): void {
    if (!this.sortColumn) {
      this.filteredUsuarios = [...this.usuarios];
      return;
    }

    this.filteredUsuarios.sort((a, b) => {
      const aVal = a[this.sortColumn as keyof Usuario];
      const bVal = b[this.sortColumn as keyof Usuario];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return this.sortDirection === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }

  trackByUserId(index: number, user: Usuario): string {
    return user.id;
  }
}
```

## 🎨 Estilos (SCSS)

### Default
```scss
th[sortable] {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;

  &:hover {
    color: #C67A3D; 
  }
}
```

### Com Indicadores
```scss
th[sortable] {
  cursor: pointer;
  user-select: none;

  &:hover {
    color: #C67A3D;
  }

  &.asc::after {
    content: ' ▲';
    color: #C67A3D;
    font-size: 0.75rem;
    margin-left: 4px;
  }

  &.desc::after {
    content: ' ▼';
    color: #C67A3D;
    font-size: 0.75rem;
    margin-left: 4px;
  }
}
```

### Dark Theme (Bootstrap)
```scss
[data-bs-theme="dark"] th[sortable] {
  color: #FFFFFF;

  &:hover {
    color: #C67A3D;  // Mantém cor em hover
  }

  &.asc::after,
  &.desc::after {
    color: #C67A3D;
  }
}
```

## 🔄 Fluxo de Funcionamento

```
1. Usuário clica em <th sortable="name">
                ↓
2. Diretiva detecta click
                ↓
3. Diretiva chama rotate()
                ↓
4. rotate() cicla: '' → 'asc' → 'desc' → ''
                ↓
5. Atualiza HostBinding (class.asc / class.desc)
                ↓
6. Emite evento SortEvent com { column, direction }
                ↓
7. Componente pai recebe via (sort)="onSort($event)"
                ↓
8. onSort() atualiza estado interno
                ↓
9. applySorting() reordena array
                ↓
10. Template detecta mudança e re-renderiza
```

## 📋 Ciclo de Ordenação

Clicando na mesma coluna:

```
Click 1: '' (nenhum)    [sem ▲/▼]
   ↓
Click 2: 'asc'          [mostra ▲]
   ↓
Click 3: 'desc'         [mostra ▼]
   ↓
Click 4: '' (volta)     [sem ▲/▼]
   ↓
Click 5: 'asc'          [mostra ▲]
```

## ⚙️ Customizações

### Alterar Símbolo de Ordenação
```typescript
// sortable.directive.ts - método rotate()
&.asc::after {
  content: ' ↑';    // Ou '🔼', '⬆️', etc
}

&.desc::after {
  content: ' ↓';    // Ou '🔽', '⬇️', etc
}
```

### Alterar Cor em Hover
```scss
th[sortable]:hover {
  color: #6571ff;   // Trocar para azul, verde, etc
}
```

### Suportar Múltiplas Colunas
Para suportar ordenação de múltiplas colunas simultaneamente:

```typescript
// No componente
multiSort: Map<string, 'asc' | 'desc'> = new Map();

onSort(event: SortEvent): void {
  if (event.direction === '') {
    this.multiSort.delete(event.column);
  } else {
    this.multiSort.set(event.column, event.direction);
  }
  this.applyMultiSort();
}

applyMultiSort(): void {
  // Implementar lógica de ordenação múltipla
}
```

## 🐛 Troubleshooting

### Diretiva não está funcionando
**Verificar**:
1. ✅ Diretiva importada no componente
2. ✅ Atributo `sortable` presente no `<th>`
3. ✅ Evento `(sort)` vinculado no template
4. ✅ Handler `onSort()` implementado

### Indicadores (▲/▼) não aparecem
**Verificar**:
1. ✅ SCSS com pseudo-elemento `::after`
2. ✅ Classes `asc` e `desc` sendo aplicadas
3. ✅ DevTools > Inspect > Verificar classes

### Ordenação não funciona
**Verificar**:
1. ✅ Array sendo clonado antes de ordenar (`[...this.usuarios]`)
2. ✅ Propriedade existe no objeto (`a[this.sortColumn]`)
3. ✅ Tipo de dado é string ou número

## 📚 Referências

- `src/app/shared/directives/sortable.directive.ts`
- `src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.ts`
- [Angular Directives](https://angular.io/guide/structural-directives)
- [Angular HostBinding](https://angular.io/api/core/HostBinding)

---

**Última atualização**: 09/12/2024  
**Status**: ✅ Implementado e Documentado

