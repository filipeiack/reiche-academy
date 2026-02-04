import { Component, OnInit, inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbTooltipModule, NgbOffcanvas, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpErrorResponse } from '@angular/common/http';

import {
  IndicadoresTemplatesService,
  IndicadorTemplate,
} from '../../../../core/services/indicadores-templates.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-indicadores-templates-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    NgbPaginationModule,
    NgbTooltipModule,
    NgbOffcanvasModule,
    NgSelectModule,
    TranslatePipe,
  ],
  templateUrl: './indicadores-templates-list.component.html',
  styleUrls: ['./indicadores-templates-list.component.scss'],
})
export class IndicadoresTemplatesListComponent implements OnInit {
  private indicadoresService = inject(IndicadoresTemplatesService);
  private pilaresService = inject(PilaresService);
  private offcanvas = inject(NgbOffcanvas);

  indicadores: IndicadorTemplate[] = [];
  indicadoresFiltered: IndicadorTemplate[] = [];
  pilares: Pilar[] = [];

  loading = false;

  // Filtros
  pilarIdFiltro: string | null = null;
  searchQuery = '';

  // Offcanvas de detalhes
  selectedIndicador: IndicadorTemplate | null = null;
  loadingDetails = false;

  // Paginação
  page = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.loadPilares();
    this.loadIndicadores();
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
    this.pilaresService.findAll().subscribe({
      next: (pilares) => {
        this.pilares = pilares.filter((p) => p.ativo);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erro ao carregar pilares:', error);
      },
    });
  }

  loadIndicadores(): void {
    this.loading = true;

    this.indicadoresService.findAll(this.pilarIdFiltro || undefined).subscribe({
      next: (indicadores) => {
        this.indicadores = indicadores;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.showToast(
          error?.error?.message || 'Erro ao carregar indicadores templates. Tente novamente.',
          'error',
        );
        this.loading = false;
        console.error('Erro ao carregar indicadores templates:', error);
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.indicadores];

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (indicador) =>
          indicador.nome.toLowerCase().includes(query) ||
          (indicador.descricao && indicador.descricao.toLowerCase().includes(query)),
      );
    }

    this.indicadoresFiltered = filtered;
    this.page = 1;
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadIndicadores();
  }

  get paginatedIndicadores(): IndicadorTemplate[] {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.indicadoresFiltered.slice(start, end);
  }

  get totalIndicadores(): number {
    return this.indicadoresFiltered.length;
  }

  getStartIndex(): number {
    if (this.indicadoresFiltered.length === 0) return 0;
    return (this.page - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const end = this.page * this.pageSize;
    return Math.min(end, this.indicadoresFiltered.length);
  }

  confirmarExclusao(indicador: IndicadorTemplate): void {
    Swal.fire({
      title: 'Confirmar Desativação',
      html: `
        <span class="text-muted">Deseja desativar o indicador template <strong>"${indicador.nome}"</strong>?</span>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sim, desativar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.excluir(indicador.id);
      }
    });
  }

  excluir(id: string): void {
    this.indicadoresService.remove(id).subscribe({
      next: () => {
        this.showToast('Indicador template desativado com sucesso', 'success');
        this.loadIndicadores();
      },
      error: (err) => {
        const message = err?.error?.message || 'Erro ao desativar indicador template';
        this.showToast(message, 'error');
      },
    });
  }

  toggleStatus(id: string, nome: string, ativo: boolean): void {
    const action = ativo ? 'inativar' : 'ativar';
    const actionCapitalized = ativo ? 'Inativar' : 'Ativar';

    Swal.fire({
      title: `Confirmar ${actionCapitalized}`,
      text: `Deseja ${action} o indicador template "${nome}"?`,
      showCancelButton: true,
      confirmButtonText: actionCapitalized,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: ativo ? '#dc3545' : '#28a745',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        const service$ = ativo
          ? this.indicadoresService.desativar(id)
          : this.indicadoresService.reativar(id);

        service$.subscribe({
          next: () => {
            this.showToast(
              `Indicador template ${ativo ? 'inativado' : 'ativado'} com sucesso`,
              'success',
            );
            this.loadIndicadores();
          },
          error: (err: any) => {
            const message = err?.error?.message || `Erro ao ${action} indicador template`;
            this.showToast(message, 'error');
          },
        });
      }
    });
  }

  openDetailsOffcanvas(id: string, content: TemplateRef<any>): void {
    this.loadingDetails = true;
    this.selectedIndicador = null;
    this.offcanvas.open(content, { position: 'end' });
    this.indicadoresService.findOne(id).subscribe({
      next: (indicador) => {
        this.selectedIndicador = indicador;
        this.loadingDetails = false;
      },
      error: (err) => {
        this.loadingDetails = false;
        this.showToast(err?.error?.message || 'Erro ao carregar detalhes', 'error');
      },
    });
  }
}
