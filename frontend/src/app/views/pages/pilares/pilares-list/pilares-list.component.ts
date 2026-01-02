import { Component, OnInit, inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { NgbPaginationModule, NgbTooltipModule, NgbOffcanvas, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { ModeloBadgeComponent } from '../../../../shared/components/modelo-badge/modelo-badge.component';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-pilares-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgbPaginationModule,
    NgbTooltipModule,
    NgSelectModule,
    NgbOffcanvasModule,
    ModeloBadgeComponent,
    TranslatePipe
  ],
  templateUrl: './pilares-list.component.html',
  styleUrl: './pilares-list.component.scss'
})
export class PilaresListComponent implements OnInit {
  private pilaresService = inject(PilaresService);
  private offcanvas = inject(NgbOffcanvas);

  pilares: Pilar[] = [];
  filteredPilares: Pilar[] = [];
  searchQuery = '';
  loading = false;
  error = '';
  
  // Filtros UI-PIL-007
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  tipoFilter: 'all' | 'modelo' | 'customizado' = 'all';

  // Opções para ng-select
  statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'active', label: 'Ativos' },
    { value: 'inactive', label: 'Inativos' }
  ];

  tipoOptions = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'modelo', label: 'Padrão' },
    { value: 'customizado', label: 'Customizados' }
  ];

  // Paginação
  currentPage = 1;
  pageSize = 10;

  // Offcanvas de detalhes
  selectedPilar: Pilar | null = null;
  loadingDetails = false;

  ngOnInit(): void {
    this.loadPilares();
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

  loadPilares(): void {
    this.loading = true;
    this.error = '';
    this.pilaresService.findAll().subscribe({
      next: (data) => {
        this.pilares = data;
        this.applyFiltersAndSort();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erro ao carregar pilares';
        this.loading = false;
      }
    });
  }

  // UI-PIL-007: Filtros
  onSearch(query: string): void {
    this.searchQuery = query;
    this.applyFiltersAndSort();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.onSearch(input.value);
  }

  onStatusFilterChange(status: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = status;
    this.applyFiltersAndSort();
  }

  onTipoFilterChange(tipo: 'all' | 'modelo' | 'customizado'): void {
    this.tipoFilter = tipo;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.pilares];

    // Filtro de busca (case-insensitive)
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.nome.toLowerCase().includes(query)
      );
    }

    // Filtro de status
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(p => p.ativo);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(p => !p.ativo);
    }

    // Filtro de tipo
    if (this.tipoFilter === 'modelo') {
      filtered = filtered.filter(p => p.modelo);
    } else if (this.tipoFilter === 'customizado') {
      filtered = filtered.filter(p => !p.modelo);
    }

    // UI-PIL-004: Ordenação
    this.filteredPilares = this.sortPilares(filtered);
  }

  // UI-PIL-004: Ordenação de Exibição
  sortPilares(pilares: Pilar[]): Pilar[] {
    return pilares.sort((a, b) => {
      // 1. Padrões primeiro
      if (a.modelo && !b.modelo) return -1;
      if (!a.modelo && b.modelo) return 1;
      
      // 2. Entre padrões: por ordem (se definida)
      if (a.modelo && b.modelo) {
        const ordemA = a.ordem ?? 9999;
        const ordemB = b.ordem ?? 9999;
        return ordemA - ordemB;
      }
      
      // 3. Entre customizados: alfabético
      return a.nome.localeCompare(b.nome);
    });
  }

  // Paginação
  get paginatedPilares(): Pilar[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPilares.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPilares.length / this.pageSize);
  }

  // UI-PIL-009: Ações por linha
  confirmDesativar(pilar: Pilar): void {
    // UI-PIL-006: Modal de Confirmação de Desativação
    
    // Primeiro, buscar detalhes do pilar (rotinas ativas)
    this.pilaresService.findOne(pilar.id).subscribe({
      next: (pilarDetalhado) => {
        const rotinasAtivas = pilarDetalhado._count?.rotinas || 0;
        
        if (rotinasAtivas > 0) {
          // Bloquear desativação
          Swal.fire({
            title: 'Não é possível desativar',
            html: `
              Este pilar possui <strong>${rotinasAtivas} rotinas ativas</strong> vinculadas.<br>
              Desative as rotinas primeiro.
            `,
            confirmButtonText: 'Entendi',
            confirmButtonColor: '#3085d6'
          });
          return;
        }

        // Permitir desativação
        const empresasUsando = pilarDetalhado._count?.empresas || 0;
        
        Swal.fire({
          title: 'Confirmar Desativação',
          html: `
            Deseja desativar o pilar <strong>"${pilar.nome}"</strong>?
            ${empresasUsando > 0 ? `<br><br>Obs: ${empresasUsando} empresa(s) está(ão) usando este pilar.<br>Elas não poderão mais vê-lo após desativação.` : ''}
          `,
          showCancelButton: true,
          confirmButtonText: 'Desativar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#d33',
          cancelButtonColor: '#6c757d'
        }).then((result) => {
          if (result.isConfirmed) {
            this.desativar(pilar.id);
          }
        });
      },
      error: (err) => {
        this.showToast('Erro ao verificar pilar', 'error');
      }
    });
  }

  desativar(id: string): void {
    this.pilaresService.remove(id).subscribe({
      next: () => {
        this.showToast('Pilar desativado com sucesso', 'success');
        this.loadPilares();
      },
      error: (err) => {
        const message = err?.error?.message || 'Erro ao desativar pilar';
        this.showToast(message, 'error');
      }
    });
  }

  reativar(id: string): void {
    Swal.fire({
      title: 'Confirmar Reativação',
      text: 'Deseja reativar este pilar?',
      showCancelButton: true,
      confirmButtonText: 'Reativar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pilaresService.reativar(id).subscribe({
          next: () => {
            this.showToast('Pilar reativado com sucesso', 'success');
            this.loadPilares();
          },
          error: (err) => {
            const message = err?.error?.message || 'Erro ao reativar pilar';
            this.showToast(message, 'error');
          }
        });
      }
    });
  }

  // Utilitários
  truncate(text: string | undefined, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  openDetailsOffcanvas(id: string, content: TemplateRef<any>): void {
    this.loadingDetails = true;
    this.selectedPilar = null;
    this.offcanvas.open(content, { position: 'end' });
    this.pilaresService.findOne(id).subscribe({
      next: (pilar) => {
        this.selectedPilar = pilar;
        this.loadingDetails = false;
      },
      error: () => {
        this.loadingDetails = false;
        this.showToast('Erro ao carregar detalhes', 'error');
      }
    });
  }
}
