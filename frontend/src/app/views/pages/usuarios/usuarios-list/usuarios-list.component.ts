import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsersService, Usuario } from '../../../../core/services/users.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, UserAvatarComponent],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss'
})
export class UsuariosListComponent implements OnInit {
  private usersService = inject(UsersService);

  usuarios: Usuario[] = [];
  filteredUsuarios: Usuario[] = [];
  searchQuery = '';
  loading = false;
  error = '';
  selectedUserIdToDelete: string | null = null;

  // Paginação
  pageSize = 10;
  currentPage = 1;
  get totalPages(): number {
    return Math.ceil(this.filteredUsuarios.length / this.pageSize);
  }

  get paginatedUsuarios(): Usuario[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsuarios.slice(start, end);
  }

  ngOnInit(): void {
    this.loadUsuarios();
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
    this.currentPage = 1;
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
        u.cargo.toLowerCase().includes(query)
      );
    }
    this.currentPage = 1;
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

  confirmDelete(usuarioId: string): void {
    this.selectedUserIdToDelete = usuarioId;
  }

  cancelDelete(): void {
    this.selectedUserIdToDelete = null;
  }

  deleteUsuario(usuarioId: string): void {
    this.loading = true;
    this.usersService.delete(usuarioId).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== usuarioId);
        this.filterUsuarios();
        this.selectedUserIdToDelete = null;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erro ao deletar usuário';
        this.loading = false;
        this.selectedUserIdToDelete = null;
      }
    });
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
}
