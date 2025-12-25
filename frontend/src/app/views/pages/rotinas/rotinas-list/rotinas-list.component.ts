import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbPagination, NgbTooltip, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import { RotinasService, Rotina } from '../../../../core/services/rotinas.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { RotinaBadgeComponent } from '../../../../shared/components/rotina-badge/rotina-badge.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-rotinas-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    NgbPagination,
    NgbTooltip,
    DragDropModule,
    RotinaBadgeComponent,
  ],
  templateUrl: './rotinas-list.component.html',
  styleUrls: ['./rotinas-list.component.scss']
})
export class RotinasListComponent implements OnInit {
  rotinas: Rotina[] = [];
  rotinasFiltered: Rotina[] = [];
  pilares: Pilar[] = [];
  
  loading = false;
  error: string | null = null;
  
  // Filtros
  pilarIdFiltro: string | null = null;
  
  // Paginação
  page = 1;
  pageSize = 10;
  
  // Drag and drop
  isDragging = false;
  
  constructor(
    private rotinasService: RotinasService,
    private pilaresService: PilaresService,
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.loadPilares();
    this.loadRotinas();
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
        this.showSuccessToast('Ordem atualizada com sucesso');
      },
      error: (error: HttpErrorResponse) => {
        this.loadRotinas(); // Reverter
        this.showErrorToast('Erro ao reordenar rotinas');
        console.error('Erro ao reordenar:', error);
      }
    });
  }

  openDeleteModal(rotina: Rotina, content: any): void {
    this.modalService.open(content, { centered: true }).result.then(
      (result) => {
        if (result === 'confirm') {
          this.deleteRotina(rotina);
        }
      },
      () => {} // Dismiss
    );
  }

  deleteRotina(rotina: Rotina): void {
    this.rotinasService.remove(rotina.id).subscribe({
      next: () => {
        this.showSuccessToast('Rotina desativada com sucesso');
        this.loadRotinas();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409) {
          const errorData = error.error;
          this.showConflictError(errorData);
        } else if (error.status === 404) {
          this.showErrorToast('Rotina não encontrada');
        } else {
          this.showErrorToast('Erro ao desativar rotina');
        }
        console.error('Erro ao deletar rotina:', error);
      }
    });
  }

  showSuccessToast(message: string): void {
    // Implementar toast service ou usar alert temporariamente
    alert(message);
  }

  showErrorToast(message: string): void {
    alert(message);
  }

  showConflictError(errorData: any): void {
    const empresas = errorData.empresasAfetadas || [];
    const empresasText = empresas.map((e: any) => e.nome).join(', ');
    const message = `Não é possível desativar esta rotina.\n\nEla está em uso por ${errorData.totalEmpresas} empresa(s):\n${empresasText}`;
    alert(message);
  }

  retry(): void {
    this.loadRotinas();
  }
}
