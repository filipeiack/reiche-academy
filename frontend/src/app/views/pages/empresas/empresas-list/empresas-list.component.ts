import { Component, OnInit, inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgbPaginationModule, NgbAlertModule, NgbOffcanvas, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { EmpresasService, Empresa } from '../../../../core/services/empresas.service';
import { SortableDirective, SortEvent } from '../../../../shared/directives/sortable.directive';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    NgbPaginationModule,
    NgbAlertModule,
    SortableDirective,
    NgbOffcanvasModule,
  ],
  templateUrl: './empresas-list.component.html',
  styleUrl: './empresas-list.component.scss'
})
export class EmpresasListComponent implements OnInit {
  private service = inject(EmpresasService);
  private offcanvas = inject(NgbOffcanvas);

  empresas: Empresa[] = [];
  filteredEmpresas: Empresa[] = [];
  searchQuery = '';
  loading = false;
  error = '';

  // Seleção múltipla
  selectedIds: Set<string> = new Set();
  headerCheckboxChecked = false;

  // Ordenação
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Paginação
  currentPage = 1;
  pageSize = 10;

  // Offcanvas de detalhes
  selectedEmpresa: Empresa | null = null;
  loadingDetails = false;

  ngOnInit(): void {
    this.loadEmpresas();
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
    Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer, timerProgressBar: true, title, icon });
  }

  loadEmpresas(): void {
    this.loading = true;
    this.error = '';
    this.service.getAll().subscribe({
      next: (data) => {
        this.empresas = data;
        this.filterEmpresas();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erro ao carregar empresas';
        this.loading = false;
      }
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.filterEmpresas();
  }

  filterEmpresas(): void {
    if (!this.searchQuery.trim()) {
      this.filteredEmpresas = [...this.empresas];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredEmpresas = this.empresas.filter(e =>
        e.nome?.toLowerCase().includes(query) ||
        e.cnpj?.toLowerCase().includes(query) ||
        e.cidade?.toLowerCase().includes(query) ||
        e.estado?.toLowerCase().includes(query)
      );
    }
    if (this.sortColumn) this.applySorting();
  }

  onSort(event: SortEvent): void {
    const column = event.column;
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
    this.filteredEmpresas.sort((a: any, b: any) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredEmpresas.length / this.pageSize);
  }

  get paginatedEmpresas(): Empresa[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredEmpresas.slice(start, end);
  }

  getStartIndex(): number {
    if (this.filteredEmpresas.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.filteredEmpresas.length);
  }

  // Seleção múltipla
  toggleHeaderCheckbox(): void {
    this.headerCheckboxChecked = !this.headerCheckboxChecked;
    const currentPageIds = this.paginatedEmpresas.map(e => e.id);
    if (this.headerCheckboxChecked) {
      currentPageIds.forEach(id => this.selectedIds.add(id));
    } else {
      currentPageIds.forEach(id => this.selectedIds.delete(id));
    }
  }

  isSelected(id: string): boolean { return this.selectedIds.has(id); }
  toggleSelection(id: string): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id);
    this.updateHeaderCheckbox();
  }
  private updateHeaderCheckbox(): void {
    const ids = this.paginatedEmpresas.map(e => e.id);
    this.headerCheckboxChecked = ids.length > 0 && ids.every(id => this.selectedIds.has(id));
  }

  // Delete em lote
  get selectedCount(): number { return this.selectedIds.size; }
  deleteSelected(): void {
    const count = this.selectedIds.size;
    if (count === 0) return;
    Swal.fire({
      title: '<strong>Deletar Empresas Selecionadas</strong>',
      html: `Tem certeza que deseja deletar <strong>${count} empresa(s)</strong>?<br><strong class="text-danger">Esta ação não pode ser desfeita!</strong>`,
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: `<i class="feather icon-trash-2"></i> Deletar ${count}`,
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
    }).then((result) => {
      if (result.isConfirmed) this.confirmDeleteBatch();
    });
  }
  private confirmDeleteBatch(): void {
    this.loading = true;
    const ids = Array.from(this.selectedIds);
    let completed = 0; let errors = 0;
    ids.forEach(id => {
      this.service.delete(id).subscribe({
        next: () => {
          completed++;
          this.empresas = this.empresas.filter(e => e.id !== id);
          if (completed + errors === ids.length) this.finalizeBatchDelete(completed, errors);
        },
        error: () => {
          errors++;
          if (completed + errors === ids.length) this.finalizeBatchDelete(completed, errors);
        }
      });
    });
  }
  private finalizeBatchDelete(completed: number, errors: number): void {
    this.selectedIds.clear();
    this.headerCheckboxChecked = false;
    this.filterEmpresas();
    this.loading = false;
    if (errors > 0) this.showToast(`${completed} deletadas, ${errors} erro(s)`, 'warning');
    else this.showToast(`${completed} empresa(s) deletada(s) com sucesso!`, 'success');
  }

  // Ações linha
  deleteEmpresa(id: string, nome: string): void {
    Swal.fire({
      title: '<strong>Deletar Empresa</strong>',
      html: `Tem certeza que deseja deletar <strong>${nome}</strong>?<br><strong class="text-danger">Esta ação não pode ser desfeita!</strong>`,
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="feather icon-trash-2"></i> Deletar',
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
    }).then((result) => { if (result.isConfirmed) this.confirmDelete(id); });
  }
  private confirmDelete(id: string): void {
    this.loading = true;
    this.service.delete(id).subscribe({
      next: () => { this.empresas = this.empresas.filter(e => e.id !== id); this.filterEmpresas(); this.showToast('Empresa deletada com sucesso!', 'success'); this.loading = false; },
      error: (err) => { this.showToast(err?.error?.message || 'Erro ao deletar empresa', 'error'); this.loading = false; }
    });
  }

  openDetailsOffcanvas(id: string, content: TemplateRef<any>): void {
    this.loadingDetails = true;
    this.selectedEmpresa = null;
    this.offcanvas.open(content, { position: 'end' });
    this.service.getById(id).subscribe({
      next: (empresa) => { 
        // Adicionar backendUrl ao logoUrl se necessário
        if (empresa.logoUrl && !empresa.logoUrl.startsWith('http')) {
          empresa.logoUrl = `${environment.backendUrl}${empresa.logoUrl}`;
        }
        this.selectedEmpresa = empresa; 
        this.loadingDetails = false; 
      },
      error: () => { this.loadingDetails = false; this.showToast('Erro ao carregar detalhes', 'error'); }
    });
  }
}
