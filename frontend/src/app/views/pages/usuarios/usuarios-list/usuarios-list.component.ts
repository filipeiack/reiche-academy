import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { UsersService, Usuario } from '../../../../core/services/users.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { NgbPaginationModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    UserAvatarComponent,
    NgxDatatableModule,
    NgbTypeaheadModule, NgbPaginationModule
],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss'
})
export class UsuariosListComponent implements OnInit {
onSort($event: Event) {
throw new Error('Method not implemented.');
}
  private usersService = inject(UsersService);

  @ViewChild('table') table!: DatatableComponent;

  usuarios: Usuario[] = [];
  filteredUsuarios: Usuario[] = [];
  searchQuery = '';
  loading = false;
  error = '';
  
  // Configurações do Ngx-Datatable
  ColumnMode = ColumnMode;
  pageSize = 5;

  ngOnInit(): void {
    this.loadUsuarios();
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
        u.email.toLowerCase().includes(query) ||
        u.cargo?.toLowerCase().includes(query)
      );
    }
    
    // Resetar para primeira página do datatable
    if (this.table) {
      this.table.offset = 0;
    }
  }

  getPerfilLabel(perfil: string): string {
    const labels: { [key: string]: string } = {
      'CONSULTOR': 'Consultor',
      'GESTOR': 'Gestor',
      'COLABORADOR': 'Colaborador',
      'LEITURA': 'Leitura'
    };
    return labels[perfil] || perfil;
  }

  getPerfilBadgeClass(perfil: string): string {
    const classes: { [key: string]: string } = {
      'CONSULTOR': 'badge-primary',
      'GESTOR': 'badge-success',
      'COLABORADOR': 'badge-info',
      'LEITURA': 'badge-secondary'
    };
    return classes[perfil] || 'badge-secondary';
  }

  toggleStatusUsuario(usuarioId: string, nome: string, ativoAtual: boolean): void {
    if (ativoAtual) {
      this.inactivateUsuario(usuarioId, nome);
    } else {
      this.activateUsuario(usuarioId, nome);
    }
  }

  inactivateUsuario(usuarioId: string, nome: string): void {
    Swal.fire({
      title: '<strong>Inativar Usuário</strong>',
      icon: 'warning',
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
      icon: 'info',
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
    Swal.fire({
      title: '<strong>Deletar Usuário</strong>',
      icon: 'error',
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

  // Paginação
  currentPage = 1;
  get totalPages(): number {
    return Math.ceil(this.filteredUsuarios.length / this.pageSize);
  }

  get paginatedUsuarios(): Usuario[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsuarios.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }


  //Sortable
}
