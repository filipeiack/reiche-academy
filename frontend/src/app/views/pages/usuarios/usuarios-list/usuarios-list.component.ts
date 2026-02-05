import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { UsersService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Usuario } from '../../../../core/models/auth.model';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { NgbAlertModule, NgbPaginationModule, NgbOffcanvas, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';
import { SortableDirective, SortEvent } from '../../../../shared/directives/sortable.directive';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    NgbPaginationModule,
    NgbAlertModule,
    NgbOffcanvasModule,
    SortableDirective,
    UserAvatarComponent
  ],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss'
})
export class UsuariosListComponent implements OnInit {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private offcanvasService = inject(NgbOffcanvas);

  usuarios: Usuario[] = [];
  filteredUsuarios: Usuario[] = [];
  searchQuery = '';
  loading = false;
  error = '';
  
  // Offcanvas de detalhes
  selectedUsuario: Usuario | null = null;
  loadingDetails = false;

  // Seleção de usuários para delete em lote
  selectedUsuariosIds: Set<string> = new Set();
  headerCheckboxChecked = false;

  // Ordenação de colunas
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Paginação
  currentPage = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.loadUsuarios();
  }

  /**
   * Verifica se o usuário logado é ADMINISTRADOR
   * Apenas ADMIN pode criar, inativar e deletar usuários via CRUD
   */
  get isAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.perfil) return false;
    
    const perfilCodigo = typeof currentUser.perfil === 'object' 
      ? currentUser.perfil.codigo 
      : currentUser.perfil;
    
    return perfilCodigo === 'ADMINISTRADOR';
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      title,
      icon,
    });
  }

  loadUsuarios(): void {
    this.loading = true;
    this.error = '';
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.filterUsuarios();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erro ao carregar usuários';
        this.loading = false;
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.filterUsuarios();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.onSearch(input.value);
  }

  filterUsuarios(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsuarios = [...this.usuarios];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsuarios = this.usuarios.filter(u =>
        u.nome.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.cargo?.toLowerCase().includes(query)
      );
    }
    
    // Aplicar ordenação se houver
    if (this.sortColumn) {
      this.applySorting();
    }
  }

  onSort(event: SortEvent): void {
    const column = event.column;
    
    // Toggle direção se for a mesma coluna
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = event.direction as 'asc' | 'desc';
    }
    
    this.applySorting();
  }

  private applySorting(): void {
    if (!this.sortColumn) return;

    this.filteredUsuarios.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'name':
          valueA = a.nome?.toLowerCase() || '';
          valueB = b.nome?.toLowerCase() || '';
          break;
        case 'email':
          valueA = a.email?.toLowerCase() || '';
          valueB = b.email?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getPerfilLabel(perfil: any): string {
    if (typeof perfil === 'object' && perfil !== null) {
      return perfil.nome || perfil.codigo || 'N/A';
    }
    const labels: { [key: string]: string } = {
      'ADMINISTRADOR': 'Administrador',
      'GESTOR': 'Gestor',
      'COLABORADOR': 'Colaborador',
      'LEITURA': 'Leitura'
    };
    return labels[perfil] || perfil;
  }

  toggleStatusUsuario(usuarioId: string, nome: string, ativoAtual: boolean): void {
    if (ativoAtual) {
      this.inactivateUsuario(usuarioId, nome);
    } else {
      this.activateUsuario(usuarioId, nome);
    }
  }

  inactivateUsuario(usuarioId: string, nome: string): void {
    // Proteção: impedir auto-inativação
    if (this.isCurrentUser(usuarioId)) {
      this.showToast('Você não pode inativar sua própria conta', 'error');
      return;
    }

    Swal.fire({
      title: '<strong>Inativar Usuário</strong>',
      html: `Tem certeza que deseja inativar <strong>${nome}</strong>?<br>O usuário não poderá mais acessar o sistema.`,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: '<i class="feather icon-check"></i> Inativar',
      confirmButtonAriaLabel: 'Inativar usuário',
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
      cancelButtonAriaLabel: 'Cancelar inativação',
      allowOutsideClick: false
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.confirmInactivate(usuarioId);
    });
  }

  activateUsuario(usuarioId: string, nome: string): void {
    Swal.fire({
      title: '<strong>Ativar Usuário</strong>',
      html: `Tem certeza que deseja ativar <strong>${nome}</strong>?<br>O usuário poderá acessar o sistema novamente.`,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: '<i class="feather icon-check"></i> Ativar',
      confirmButtonAriaLabel: 'Ativar usuário',
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
      cancelButtonAriaLabel: 'Cancelar ativação',
      allowOutsideClick: false
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.confirmActivate(usuarioId);
    });
  }

  private confirmActivate(usuarioId: string): void {
    this.loading = true;
    this.usersService.activate(usuarioId).subscribe({
      next: () => {
        this.usuarios = this.usuarios.map(u => 
          u.id === usuarioId ? { ...u, ativo: true } : u
        );
        this.filterUsuarios();
        this.showToast('Usuário ativado com sucesso!', 'success');
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao ativar usuário', 'error');
        this.loading = false;
      }
    });
  }

  private confirmInactivate(usuarioId: string): void {
    this.loading = true;
    this.usersService.inactivate(usuarioId).subscribe({
      next: () => {
        this.usuarios = this.usuarios.map(u => 
          u.id === usuarioId ? { ...u, ativo: false } : u
        );
        this.filterUsuarios();
        this.showToast('Usuário inativado com sucesso!', 'success');
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao inativar usuário', 'error');
        this.loading = false;
      }
    });
  }

  deleteUsuario(usuarioId: string, nome: string): void {
    // Proteção: impedir auto-delete
    if (this.isCurrentUser(usuarioId)) {
      this.showToast('Você não pode deletar sua própria conta', 'error');
      return;
    }

    Swal.fire({
      title: '<strong>Deletar Usuário</strong>',
      html: `Tem certeza que deseja deletar <strong>${nome}</strong> permanentemente?<br><strong class="text-danger">Esta ação não pode ser desfeita!</strong>`,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: '<i class="feather icon-trash-2"></i> Deletar',
      confirmButtonAriaLabel: 'Deletar usuário',
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
      cancelButtonAriaLabel: 'Cancelar exclusão',
      allowOutsideClick: false
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.confirmDelete(usuarioId);
    });
  }

  private confirmDelete(usuarioId: string): void {
    this.loading = true;
    this.usersService.delete(usuarioId).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== usuarioId);
        this.filterUsuarios();
        this.showToast('Usuário deletado com sucesso!', 'success');
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao deletar usuário', 'error');
        this.loading = false;
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsuarios.length / this.pageSize);
  }

  /**
   * Verifica se o usuário é o próprio usuário logado
   */
  isCurrentUser(usuarioId: string): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id === usuarioId;
  }

  getStartIndex(): number {
    if (this.filteredUsuarios.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.filteredUsuarios.length);
  }

  get paginatedUsuarios(): Usuario[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsuarios.slice(start, end);
  }

  // ========================================
  // SELEÇÃO DE USUÁRIOS PARA DELETE EM LOTE
  // ========================================

  get selectedCount(): number {
    return this.selectedUsuariosIds.size;
  }

  toggleHeaderCheckbox(): void {
    if (this.headerCheckboxChecked) {
      // Marcar todos da página atual
      this.paginatedUsuarios.forEach(u => this.selectedUsuariosIds.add(u.id));
    } else {
      // Desmarcar todos da página atual
      this.paginatedUsuarios.forEach(u => this.selectedUsuariosIds.delete(u.id));
    }
  }

  toggleUsuarioSelection(usuarioId: string): void {
    if (this.selectedUsuariosIds.has(usuarioId)) {
      this.selectedUsuariosIds.delete(usuarioId);
    } else {
      this.selectedUsuariosIds.add(usuarioId);
    }
    
    // Sincronizar estado do checkbox do header
    this.updateHeaderCheckboxState();
  }

  isUsuarioSelected(usuarioId: string): boolean {
    return this.selectedUsuariosIds.has(usuarioId);
  }

  private updateHeaderCheckboxState(): void {
    const totalPaginatedUsuarios = this.paginatedUsuarios.length;
    const selectedPaginatedCount = this.paginatedUsuarios.filter(u => 
      this.selectedUsuariosIds.has(u.id)
    ).length;
    
    this.headerCheckboxChecked = totalPaginatedUsuarios > 0 && 
      selectedPaginatedCount === totalPaginatedUsuarios;
  }

  deleteSelectedUsuarios(): void {
    if (this.selectedUsuariosIds.size === 0) return;

    const currentUser = this.authService.getCurrentUser();
    
    // Filtrar próprio usuário da lista de seleção
    const idsToDelete = Array.from(this.selectedUsuariosIds).filter(id => id !== currentUser?.id);
    
    if (idsToDelete.length === 0) {
      this.showToast('Você não pode deletar sua própria conta', 'error');
      return;
    }

    // Avisar se próprio usuário estava na seleção
    if (idsToDelete.length < this.selectedUsuariosIds.size) {
      this.showToast('Sua própria conta foi removida da seleção', 'info', 4000);
    }

    const count = idsToDelete.length;
    Swal.fire({
      title: '<strong>Deletar Usuários</strong>',
      html: `Tem certeza que deseja deletar <strong>${count} usuário(s)</strong> permanentemente?<br><strong class="text-danger">Esta ação não pode ser desfeita!</strong>`,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: '<i class="feather icon-trash-2"></i> Deletar',
      confirmButtonAriaLabel: 'Deletar usuários',
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
      cancelButtonAriaLabel: 'Cancelar exclusão',
      allowOutsideClick: false
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.confirmDeleteSelected(idsToDelete);
    });
  }

  private confirmDeleteSelected(idsToDelete: string[]): void {
    this.loading = true;
    let deletedCount = 0;
    let errorCount = 0;

    // Deletar cada usuário
    const deleteRequests = idsToDelete.map(id =>
      new Promise<void>((resolve) => {
        this.usersService.delete(id).subscribe({
          next: () => {
            deletedCount++;
            resolve();
          },
          error: () => {
            errorCount++;
            resolve();
          }
        });
      })
    );

    Promise.all(deleteRequests).then(() => {
      // Remover do array de usuários (apenas os que foram efetivamente deletados)
      this.usuarios = this.usuarios.filter(u => 
        !idsToDelete.includes(u.id)
      );
      
      // Limpar seleção
      this.selectedUsuariosIds.clear();
      this.headerCheckboxChecked = false;
      
      // Recarregar filtro
      this.filterUsuarios();
      this.loading = false;

      if (errorCount === 0) {
        this.showToast(`${deletedCount} usuário(s) deletado(s) com sucesso!`, 'success');
      } else {
        this.showToast(`${deletedCount} deletados, ${errorCount} com erro`, 'warning');
      }
    });
  }

  // ========================================
  // OFFCANVAS DE DETALHES
  // ========================================

  openDetailsOffcanvas(usuarioId: string, content: any): void {
    this.loadingDetails = true;
    this.selectedUsuario = null;
    
    // Abrir offcanvas
    this.offcanvasService.open(content, { 
      position: 'end',
      backdrop: true,
      keyboard: true,
      panelClass: 'offcanvas-large'
    });
    
    // Buscar dados do usuário no backend
    this.usersService.getById(usuarioId).subscribe({
      next: (usuario) => {
        this.selectedUsuario = usuario;
        this.loadingDetails = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao carregar detalhes do usuário', 'error');
        this.loadingDetails = false;
        this.offcanvasService.dismiss();
      }
    });
  }
}
