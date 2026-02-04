import { Component, OnInit, inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbTooltipModule, NgbOffcanvas, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { ObjetivosTemplatesService, ObjetivoTemplate } from '../../../../core/services/objetivos-templates.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-objetivos-templates-list',
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
  templateUrl: './objetivos-templates-list.component.html',
  styleUrls: ['./objetivos-templates-list.component.scss'],
})
export class ObjetivosTemplatesListComponent implements OnInit {
  private objetivosService = inject(ObjetivosTemplatesService);
  private pilaresService = inject(PilaresService);
  private offcanvas = inject(NgbOffcanvas);

  objetivos: ObjetivoTemplate[] = [];
  objetivosFiltered: ObjetivoTemplate[] = [];
  pilares: Pilar[] = [];

  loading = false;

  // Filtros
  pilarIdFiltro: string | null = null;
  searchQuery = '';

  // Offcanvas de detalhes
  selectedObjetivo: ObjetivoTemplate | null = null;
  loadingDetails = false;

  // Paginação
  page = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.loadPilares();
    this.loadObjetivos();
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

  loadObjetivos(): void {
    this.loading = true;
    this.objetivosService.findAll().subscribe({
      next: (objetivos) => {
        this.objetivos = objetivos;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erro ao carregar objetivos templates:', error);
        this.loading = false;
      },
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const query = this.searchQuery.toLowerCase().trim();

    this.objetivosFiltered = this.objetivos.filter((objetivo) => {
      const matchesPilar = this.pilarIdFiltro ? objetivo.pilarId === this.pilarIdFiltro : true;
      const searchableText = [
        objetivo.entradas,
        objetivo.saidas,
        objetivo.missao,
        objetivo.pilar?.nome,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = query ? searchableText.includes(query) : true;

      return matchesPilar && matchesQuery;
    });

    this.page = 1;
  }

  get totalObjetivos(): number {
    return this.objetivosFiltered.length;
  }

  get paginatedObjetivos(): ObjetivoTemplate[] {
    const startIndex = (this.page - 1) * this.pageSize;
    return this.objetivosFiltered.slice(startIndex, startIndex + this.pageSize);
  }

  getStartIndex(): number {
    return (this.page - 1) * this.pageSize;
  }

  getEndIndex(): number {
    return Math.min(this.page * this.pageSize, this.totalObjetivos);
  }

  openDetailsOffcanvas(id: string, content: TemplateRef<any>): void {
    this.loadingDetails = true;
    this.selectedObjetivo = null;

    this.offcanvas.open(content, { position: 'end', backdrop: true, panelClass: 'offcanvas-objetivo-detalhes' });

    this.objetivosService.findOne(id).subscribe({
      next: (objetivo) => {
        this.selectedObjetivo = objetivo;
        this.loadingDetails = false;
      },
      error: () => {
        this.loadingDetails = false;
        this.showToast('Erro ao carregar detalhes', 'error');
      },
    });
  }

  confirmarExclusao(objetivo: ObjetivoTemplate): void {
    Swal.fire({
      title: 'Excluir objetivo template?',
      text: 'Esta ação não poderá ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.excluir(objetivo.id);
      }
    });
  }

  excluir(id: string): void {
    this.objetivosService.remove(id).subscribe({
      next: () => {
        this.showToast('Objetivo template excluído com sucesso', 'success');
        this.loadObjetivos();
      },
      error: (err) => {
        const message = err?.error?.message || 'Erro ao excluir objetivo template';
        this.showToast(message, 'error');
      },
    });
  }
}
