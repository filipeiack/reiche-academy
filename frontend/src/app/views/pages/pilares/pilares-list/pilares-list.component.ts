import { Component, OnInit, inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { NgbPaginationModule, NgbTooltipModule, NgbOffcanvas, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
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
    TranslatePipe,
    DragDropModule
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

  // Opções para ng-select
  statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'active', label: 'Ativos' },
    { value: 'inactive', label: 'Inativos' }
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

    // UI-PIL-004: Ordenação
    this.filteredPilares = this.sortPilares(filtered);
  }

  // UI-PIL-004: Ordenação de Exibição
  sortPilares(pilares: Pilar[]): Pilar[] {
    return pilares.sort((a, b) => {
      // Ordenar por ordem se definida, senão alfabético
      const ordemA = a.ordem ?? 9999;
      const ordemB = b.ordem ?? 9999;
      
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      
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

  getStartIndex(): number {
    if (this.filteredPilares.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.filteredPilares.length);
  }

  // UI-PIL-009: Ações por linha
  confirmarExclusao(pilar: Pilar): void {
    // UI-PIL-006: Modal de Confirmação de Exclusão
    
    // Primeiro, buscar detalhes do pilar
    this.pilaresService.findOne(pilar.id).subscribe({
      next: (pilarDetalhado) => {
        const rotinasCount = pilarDetalhado._count?.rotinas || 0;
        const empresasUsando = pilarDetalhado._count?.empresas || 0;
        
        if (empresasUsando > 0) {
          // Se houver empresas, permitir apenas desativação
          Swal.fire({
            title: 'Pilar em Uso',
            html: `
              <span class="text-muted">Este pilar está sendo usado por <strong>${empresasUsando} empresa(s)</strong>.<br><br>
              Não é possível excluí-lo permanentemente, mas você pode <strong>desativá-lo</strong>.<br><br>
              Deseja desativar o pilar <strong>"${pilar.nome}"</strong>?</span>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sim, desativar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
          }).then((result) => {
            if (result.isConfirmed) {
              this.excluir(pilar.id);
            }
          });
          return;
        }

        // Se não houver empresas, permitir exclusão permanente (com ou sem rotinas)
        if (rotinasCount > 0) {
          // Avisar sobre exclusão em cascata
          Swal.fire({
            title: 'Confirmar Exclusão em Cascata',
            html: `
              <span class="text-muted">O pilar <strong>"${pilar.nome}"</strong> possui <strong>${rotinasCount} rotina(s)</strong> vinculada(s).<br><br>
              Ao excluir o pilar, todas as rotinas vinculadas também serão <strong>excluídas permanentemente</strong>.</span><br><br>
              <span class="text-danger">Esta ação não pode ser desfeita!</span>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir tudo',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
          }).then((result) => {
            if (result.isConfirmed) {
              this.excluir(pilar.id);
            }
          });
        } else {
          // Sem rotinas, exclusão simples
          Swal.fire({
            title: 'Confirmar Exclusão Permanente',
            html: `
              <span class="text-muted">Tem certeza que deseja <strong>excluir permanentemente</strong> o pilar <strong>"${pilar.nome}"</strong>?</span><br><br>
              <span class="text-danger">Esta ação não pode ser desfeita!</span>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir permanentemente',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
          }).then((result) => {
            if (result.isConfirmed) {
              this.excluir(pilar.id);
            }
          });
        }
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao verificar pilar', 'error');
      }
    });
  }

  excluir(id: string): void {
    this.pilaresService.remove(id).subscribe({
      next: (response) => {
        // Verificar se foi desativado ou excluído baseado no response
        const mensagem = response.ativo === false 
          ? 'Pilar desativado com sucesso' 
          : 'Pilar excluído com sucesso';
        this.showToast(mensagem, 'success');
        this.loadPilares();
      },
      error: (err) => {
        const message = err?.error?.message || 'Erro ao excluir pilar';
        this.showToast(message, 'error');
      }
    });
  }

  toggleStatus(id: string, nome: string, ativo: boolean): void {
    const action = ativo ? 'inativar' : 'ativar';
    const actionCapitalized = ativo ? 'Inativar' : 'Ativar';
    
    Swal.fire({
      title: `Confirmar ${actionCapitalized}`,
      text: `Deseja ${action} o pilar "${nome}"?`,
      showCancelButton: true,
      confirmButtonText: actionCapitalized,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: ativo ? '#dc3545' : '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        const service$ = ativo 
          ? this.pilaresService.desativar(id)
          : this.pilaresService.reativar(id);
        
        service$.subscribe({
          next: () => {
            this.showToast(`Pilar ${ativo ? 'inativado' : 'ativado'} com sucesso`, 'success');
            this.loadPilares();
          },
          error: (err: any) => {
            const message = err?.error?.message || `Erro ao ${action} pilar`;
            this.showToast(message, 'error');
          }
        });
      }
    });
  }

  onDropPilares(event: CdkDragDrop<Pilar[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.filteredPilares, event.previousIndex, event.currentIndex);
      
      // Atualizar a ordem de todos os pilares
      this.filteredPilares.forEach((pilar, index) => {
        pilar.ordem = index + 1;
      });
      
      // Salvar automaticamente
      this.salvarOrdem();
    }
  }

  async salvarOrdem(): Promise<void> {
    try {
      const novasOrdens = this.filteredPilares.map((p, idx) => ({
        id: p.id,
        ordem: idx + 1
      }));

      await this.pilaresService.reordenar(novasOrdens).toPromise();
      
      this.showToast('Ordem dos pilares atualizada com sucesso.', 'success');
      
      this.loadPilares();
    } catch (error) {
      const message = (error as any)?.error?.message || 'Erro ao salvar a ordem dos pilares. Tente novamente';
      this.showToast(message, 'error');
    }
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
      error: (err) => {
        this.loadingDetails = false;
        this.showToast(err?.error?.message || 'Erro ao carregar detalhes', 'error');
      }
    });
  }
}
