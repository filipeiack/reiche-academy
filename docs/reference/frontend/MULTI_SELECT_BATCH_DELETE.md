# Multi-Select & Batch Delete Feature Guide

Documentação completa para implementar seleção múltipla e delete em lote em tabelas.

## 📍 Localização

```
src/app/views/pages/usuarios/usuarios-list/
├── usuarios-list.component.ts      # Lógica
├── usuarios-list.component.html    # Template
└── usuarios-list.component.scss    # Estilos
```

## 🎯 Objetivo

Implementar:
1. Checkboxes para seleção múltipla
2. Checkbox header que marca/desmarca todos
3. Alert bar que aparece quando há itens selecionados
4. Botão delete para remover múltiplos itens em lote
5. Confirmação via SweetAlert2

## 📦 Dependências

```typescript
// Imports necessários
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';  // npm install sweetalert2
```

## 💻 Implementação

### 1. Componente TypeScript

#### Estado (Properties)
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { UsersService } from '@app/core/services/users.service';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbAlertModule],
  templateUrl: './usuarios-list.component.html'
})
export class UsuariosListComponent implements OnInit {
  
  // ========== MULTI-SELECT STATE ==========
  selectedUsuariosIds: Set<string> = new Set();
  headerCheckboxChecked: boolean = false;
  
  // ========== DATA ==========
  usuarios: Usuario[] = [];
  filteredUsuarios: Usuario[] = [];
  
  // ========== PAGINATION/FILTERING ==========
  searchTerm: string = '';
  
  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  // ========== MULTI-SELECT METHODS ==========

  /**
   * Alterna seleção de um usuário específico
   * @param id - ID do usuário
   */
  toggleUsuarioSelection(id: string): void {
    if (this.selectedUsuariosIds.has(id)) {
      this.selectedUsuariosIds.delete(id);
    } else {
      this.selectedUsuariosIds.add(id);
    }
    this.updateHeaderCheckbox();
  }

  /**
   * Verifica se um usuário está selecionado
   * @param id - ID do usuário
   */
  isUsuarioSelected(id: string): boolean {
    return this.selectedUsuariosIds.has(id);
  }

  /**
   * Alterna seleção de todos os usuários (página atual)
   */
  toggleHeaderCheckbox(): void {
    if (this.headerCheckboxChecked) {
      // Marcar todos
      this.filteredUsuarios.forEach(u => {
        this.selectedUsuariosIds.add(u.id);
      });
    } else {
      // Desmarcar todos
      this.selectedUsuariosIds.clear();
    }
  }

  /**
   * Atualiza estado do checkbox header baseado em seleções
   */
  updateHeaderCheckbox(): void {
    const allSelected = this.filteredUsuarios.every(u => 
      this.selectedUsuariosIds.has(u.id)
    );
    const someSelected = this.filteredUsuarios.some(u => 
      this.selectedUsuariosIds.has(u.id)
    );

    this.headerCheckboxChecked = allSelected;
    // Nota: Para "indeterminate", usar JavaScript:
    // document.querySelector('input[name="header-checkbox"]').indeterminate = someSelected && !allSelected;
  }

  /**
   * Número de usuários selecionados
   */
  get selectedCount(): number {
    return this.selectedUsuariosIds.size;
  }

  /**
   * Limpa seleção
   */
  clearSelection(): void {
    this.selectedUsuariosIds.clear();
    this.headerCheckboxChecked = false;
  }

  // ========== DELETE METHODS ==========

  /**
   * Deleta múltiplos usuários com confirmação
   */
  deleteSelectedUsuarios(): void {
    if (this.selectedCount === 0) {
      Swal.fire('Aviso', 'Selecione pelo menos um usuário', 'warning');
      return;
    }

    Swal.fire({
      title: 'Confirmar exclusão?',
      html: `<p>Tem certeza que deseja remover <strong>${this.selectedCount}</strong> usuário(s)?</p>
             <small style="color: #ff6b6b;">Esta ação não pode ser desfeita.</small>`,
      showCancelButton: true,
      confirmButtonText: 'Sim, deletar',
      confirmButtonColor: '#C67A3D',
      cancelButtonText: 'Cancelar',
      didOpen: (modal) => {
        // Focar botão de cancelar por segurança
        modal.querySelector('.swal2-cancel') as HTMLElement;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeDelete();
      }
    });
  }

  /**
   * Executa a exclusão no backend
   */
  private executeDelete(): void {
    const idsToDelete = Array.from(this.selectedUsuariosIds);

    // Mostrar loading
    Swal.fire({
      title: 'Deletando...',
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    this.usersService.deleteMultiple(idsToDelete).subscribe({
      next: () => {
        // Sucesso
        this.clearSelection();
        this.loadUsuarios();
        
        Swal.fire({
          title: 'Sucesso!',
          text: `${this.selectedCount} usuário(s) deletado(s) com sucesso`,
          icon: 'success',
          confirmButtonColor: '#C67A3D'
        });
      },
      error: (err) => {
        // Erro
        Swal.fire({
          title: 'Erro!',
          text: err.error?.message || 'Erro ao deletar usuários',
          icon: 'error',
          confirmButtonColor: '#C67A3D'
        });
      }
    });
  }

  /**
   * Deleta um usuário individual
   * @param id - ID do usuário
   */
  deleteUsuario(id: string): void {
    Swal.fire({
      title: 'Deletar usuário?',
      text: 'Esta ação não pode ser desfeita',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Deletar',
      confirmButtonColor: '#C67A3D'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usersService.delete(id).subscribe({
          next: () => {
            this.loadUsuarios();
            Swal.fire('Deletado!', 'Usuário removido', 'success');
          },
          error: (err) => {
            Swal.fire('Erro!', err.error?.message, 'error');
          }
        });
      }
    });
  }

  // ========== DATA LOADING ==========

  loadUsuarios(): void {
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Erro ao carregar usuários', err);
      }
    });
  }

  applyFilters(): void {
    if (!this.searchTerm) {
      this.filteredUsuarios = [...this.usuarios];
    } else {
      this.filteredUsuarios = this.usuarios.filter(u =>
        u.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.updateHeaderCheckbox();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  // ========== TRACK FUNCTION ==========

  trackByUsuarioId(index: number, usuario: Usuario): string {
    return usuario.id;
  }
}

// ========== TYPES ==========

interface Usuario {
  id: string;
  name: string;
  email: string;
  status?: 'active' | 'inactive';
  createdAt?: Date;
}
```

### 2. Template HTML

#### Alert Bar (Seleção)
```html
<!-- Alert quando há itens selecionados -->
<div *ngIf="selectedCount > 0">
  <ngb-alert type="warning" [dismissible]="false" class="alert-custom-primary">
    <div class="d-flex justify-content-between align-items-center">
      <span>
        <strong>{{ selectedCount }}</strong> usuário(s) selecionado(s)
      </span>
      <div class="btn-group" role="group">
        <button 
          type="button" 
          class="btn btn-sm btn-danger"
          (click)="deleteSelectedUsuarios()">
          <i class="feather-trash-2"></i> Deletar Selecionados
        </button>
        <button 
          type="button" 
          class="btn btn-sm btn-secondary"
          (click)="clearSelection()">
          <i class="feather-x"></i> Limpar Seleção
        </button>
      </div>
    </div>
  </ngb-alert>
</div>
```

#### Search Input
```html
<div class="mb-3">
  <input 
    type="text" 
    class="form-control" 
    placeholder="Buscar por nome ou email..."
    [value]="searchTerm"
    (change)="onSearchChange($event.target.value)"
    (keyup)="onSearchChange($event.target.value)">
</div>
```

#### Tabela com Checkboxes
```html
<div class="table-responsive">
  <table class="table table-hover">
    <thead>
      <tr>
        <!-- Checkbox Header -->
        <th style="width: 50px;">
          <input 
            type="checkbox" 
            class="form-check-input"
            [(ngModel)]="headerCheckboxChecked"
            (change)="toggleHeaderCheckbox()">
        </th>
        
        <!-- Colunas Normais -->
        <th>Nome</th>
        <th>Email</th>
        <th style="width: 100px;">Ações</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let usuario of filteredUsuarios; trackBy: trackByUsuarioId"
          [class.table-active]="isUsuarioSelected(usuario.id)">
        
        <!-- Checkbox Linha -->
        <td>
          <input 
            type="checkbox" 
            class="form-check-input"
            [checked]="isUsuarioSelected(usuario.id)"
            (change)="toggleUsuarioSelection(usuario.id)">
        </td>
        
        <!-- Dados -->
        <td>{{ usuario.name }}</td>
        <td>{{ usuario.email }}</td>
        
        <!-- Ação Individual -->
        <td>
          <button 
            type="button" 
            class="btn btn-sm btn-danger"
            (click)="deleteUsuario(usuario.id)">
            Deletar
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Mensagem vazia -->
<div *ngIf="filteredUsuarios.length === 0" class="alert alert-info">
  Nenhum usuário encontrado
</div>
```

### 3. Estilos SCSS

```scss
// usuarios-list.component.scss

// Alert customizado (delete bar)
::ng-deep .alert-custom-primary {
  background-color: rgba(198, 122, 61, 0.1);  // Orange 10%
  border-color: rgba(198, 122, 61, 0.3);      // Orange 30%
  border-radius: 8px;
  border-width: 1px;
  color: #FFFFFF;
  
  [data-bs-theme="light"] & {
    color: #1A1A1A;
  }
}

// Linha selecionada
.table-active {
  background-color: rgba(198, 122, 61, 0.1) !important;
}

// Checkbox styling
.form-check-input {
  cursor: pointer;
  border-color: #C67A3D;
  
  &:checked {
    background-color: #C67A3D;
    border-color: #C67A3D;
  }
  
  &:focus {
    border-color: #C67A3D;
    box-shadow: 0 0 0 0.2rem rgba(198, 122, 61, 0.25);
  }
}

// Table hover
.table-hover tbody tr:hover {
  background-color: rgba(198, 122, 61, 0.1) !important;
}

// Buttons
.btn-group {
  .btn {
    margin-left: 8px;
    
    &:first-child {
      margin-left: 0;
    }
  }
}

// Responsivo
@media (max-width: 768px) {
  .alert-custom-primary {
    flex-direction: column;
    gap: 12px;
    
    .btn-group {
      width: 100%;
      display: flex;
      flex-direction: column;
      
      .btn {
        margin-left: 0;
        margin-top: 8px;
        width: 100%;
        
        &:first-child {
          margin-top: 0;
        }
      }
    }
  }
}
```

## 🔄 Fluxo de Funcionamento

```
1. Usuário marca checkbox em linha
                ↓
2. toggleUsuarioSelection(id) executa
                ↓
3. Set<string> adiciona/remove ID
                ↓
4. updateHeaderCheckbox() verifica se todos estão selecionados
                ↓
5. *ngIf="selectedCount > 0" mostra alert bar
                ↓
6. Usuário clica "Deletar Selecionados"
                ↓
7. deleteSelectedUsuarios() mostra confirmação
                ↓
8. executeDelete() chama serviço
                ↓
9. Backend deleta todos os IDs
                ↓
10. clearSelection() + reload
```


```

## 🧪 Casos de Teste

```typescript
// 1. Selecionar um item
✓ checkbox marca
✓ selectedUsuariosIds contém ID
✓ selectedCount = 1
✓ alert bar visível

// 2. Selecionar todos via header
✓ todos os checkboxes marcam
✓ selectedUsuariosIds contém todos
✓ selectedCount = tamanho do array

// 3. Filtrar enquanto há seleção
✓ filteredUsuarios reduz
✓ updateHeaderCheckbox() chamado
✓ header checkbox desmarcado se necessário

// 4. Delete com confirmação
✓ Swal abre
✓ Se confirmado, chamada ao backend
✓ clearSelection() executado
✓ loadUsuarios() reload dados
✓ Alert de sucesso
```

## 📋 Checklist de Implementação

- [ ] Estado `selectedUsuariosIds: Set<string>` criado
- [ ] Estado `headerCheckboxChecked: boolean` criado
- [ ] Método `toggleUsuarioSelection()` implementado
- [ ] Método `isUsuarioSelected()` implementado
- [ ] Método `toggleHeaderCheckbox()` implementado
- [ ] Método `updateHeaderCheckbox()` implementado
- [ ] Getter `selectedCount` implementado
- [ ] Método `clearSelection()` implementado
- [ ] Método `deleteSelectedUsuarios()` implementado
- [ ] Método `executeDelete()` implementado
- [ ] Checkbox header no template
- [ ] Checkbox linhas no template
- [ ] Alert bar condicional no template
- [ ] Botão delete no alert
- [ ] Botão clear selection no alert
- [ ] SCSS com estilos de seleção
- [ ] ng-bootstrap NgbAlertModule importado
- [ ] SweetAlert2 instalado e importado
- [ ] UsersService.deleteMultiple() implementado no backend
- [ ] Testes E2E criados

## 📚 Referências

- `src/app/views/pages/usuarios/usuarios-list/`
- [Angular FormsModule](https://angular.io/api/forms/FormsModule)
- [ng-bootstrap Alert](https://ng-bootstrap.github.io/#/components/alert)
- [SweetAlert2](https://sweetalert2.github.io/)

---

**Última atualização**: 09/12/2024  
**Status**: ✅ Implementado e Documentado

