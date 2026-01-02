import { Component, OnInit, inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbTooltipModule, NgbOffcanvas, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';

import { RotinasService, Rotina } from '../../../../core/services/rotinas.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { ModeloBadgeComponent } from '../../../../shared/components/modelo-badge/modelo-badge.component';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from "../../../../core/pipes/translate.pipe";

@Component({
  selector: 'app-rotinas-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    NgbPaginationModule,
    NgbTooltipModule,
    NgbOffcanvasModule,
    NgSelectModule,
    DragDropModule,
    ModeloBadgeComponent,
    TranslatePipe
],
  templateUrl: './rotinas-list.component.html',
  styleUrls: ['./rotinas-list.component.scss']
})
export class RotinasListComponent implements OnInit {
  private rotinasService = inject(RotinasService);
  private pilaresService = inject(PilaresService);
  private offcanvas = inject(NgbOffcanvas);

  rotinas: Rotina[] = [];
  rotinasFiltered: Rotina[] = [];
  pilares: Pilar[] = [];
  
  loading = false;
  error: string | null = null;
  
  // Filtros
  pilarIdFiltro: string | null = null;
  searchQuery = '';
  
  // Offcanvas de detalhes
  selectedRotina: Rotina | null = null;
  loadingDetails = false;
  
  // Opções para ng-select (filtro de pilar)
  get pilarOptions() {
    return [
      { value: null, label: 'Todos os Pilares' },
      ...this.pilares.map(p => ({ value: p.id, label: p.nome }))
    ];
  }
  
  // Paginação
  page = 1;
  pageSize = 10;
  
  // Drag and drop
  isDragging = false;

  ngOnInit(): void {
    this.loadPilares();
    this.loadRotinas();
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
        this.pilares = pilares.filter(p => p.ativo);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erro ao carregar pilares:', error);
      }
    });
  }

  loadRotinas(): void {
    this.loading = true;
    this.error = null;
    
    this.rotinasService.findAll(this.pilarIdFiltro || undefined).subscribe({
      next: (rotinas) => {
        this.rotinas = rotinas;
        this.rotinasFiltered = rotinas;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.error = 'Erro ao carregar rotinas. Tente novamente.';
        this.loading = false;
        console.error('Erro ao carregar rotinas:', error);
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadRotinas();
  }

  get paginatedRotinas(): Rotina[] {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.rotinasFiltered.slice(start, end);
  }

  get totalRotinas(): number {
    return this.rotinasFiltered.length;
  }

  get rotinasCountText(): string {
    if (this.pilarIdFiltro) {
      const pilar = this.pilares.find(p => p.id === this.pilarIdFiltro);
      const pilarNome = pilar?.nome || 'pilar selecionado';
      return `${this.totalRotinas} rotina(s) encontrada(s) no ${pilarNome}`;
    }
    return `${this.totalRotinas} rotina(s) encontrada(s)`;
  }

  get canReorder(): boolean {
    return !!this.pilarIdFiltro;
  }

  truncateText(text: string | undefined, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  onDrop(event: CdkDragDrop<Rotina[]>): void {
    if (!this.canReorder) return;

    const rotinasReordenadas = [...this.paginatedRotinas];
    moveItemInArray(rotinasReordenadas, event.previousIndex, event.currentIndex);

    // Calcular novas ordens
    const ordens = rotinasReordenadas.map((rotina, index) => ({
      id: rotina.id,
      ordem: index + 1
    }));

    this.rotinasService.reordenarPorPilar(this.pilarIdFiltro!, ordens).subscribe({
      next: (rotinasAtualizadas) => {
        this.rotinas = rotinasAtualizadas;
        this.rotinasFiltered = rotinasAtualizadas;
        this.showToast('Ordem atualizada com sucesso', 'success');
      },
      error: (error: HttpErrorResponse) => {
        this.loadRotinas(); // Reverter
        this.showToast('Erro ao reordenar rotinas', 'error');
        console.error('Erro ao reordenar:', error);
      }
    });
  }

  confirmDesativar(rotina: Rotina): void {
    Swal.fire({
      title: 'Confirmar Desativação',
      html: `Deseja desativar a rotina <strong>"${rotina.nome}"</strong>?`,
      showCancelButton: true,
      confirmButtonText: 'Desativar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteRotina(rotina);
      }
    });
  }

  deleteRotina(rotina: Rotina): void {
    this.rotinasService.remove(rotina.id).subscribe({
      next: () => {
        this.showToast('Rotina desativada com sucesso', 'success');
        this.loadRotinas();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409) {
          const errorData = error.error;
          this.showConflictError(errorData);
        } else if (error.status === 404) {
          this.showToast('Rotina não encontrada', 'error');
        } else {
          this.showToast('Erro ao desativar rotina', 'error');
        }
        console.error('Erro ao deletar rotina:', error);
      }
    });
  }

  showConflictError(errorData: any): void {
    const empresas = errorData.empresasAfetadas || [];
    const empresasText = empresas.map((e: any) => `<li>${e.nome}</li>`).join('');
    
    Swal.fire({
      title: 'Não é possível desativar',
      html: `
        Esta rotina está em uso por <strong>${errorData.totalEmpresas} empresa(s)</strong>:<br><br>
        <ul style="text-align: left;">${empresasText}</ul>
        <br>Remova o vínculo primeiro.
      `,
      confirmButtonText: 'Entendi',
      confirmButtonColor: '#3085d6'
    });
  }

  reativar(id: string): void {
    Swal.fire({
      title: 'Confirmar Reativação',
      text: 'Deseja reativar esta rotina?',
      showCancelButton: true,
      confirmButtonText: 'Reativar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rotinasService.reativar(id).subscribe({
          next: () => {
            this.showToast('Rotina reativada com sucesso', 'success');
            this.loadRotinas();
          },
          error: (err) => {
            const message = err?.error?.message || 'Erro ao reativar rotina';
            this.showToast(message, 'error');
          }
        });
      }
    });
  }

  openDetailsOffcanvas(id: string, content: TemplateRef<any>): void {
    this.loadingDetails = true;
    this.selectedRotina = null;
    this.offcanvas.open(content, { position: 'end' });
    this.rotinasService.findOne(id).subscribe({
      next: (rotina) => {
        this.selectedRotina = rotina;
        this.loadingDetails = false;
      },
      error: () => {
        this.loadingDetails = false;
        this.showToast('Erro ao carregar detalhes', 'error');
      }
    });
  }

  retry(): void {
    this.loadRotinas();
  }
}
