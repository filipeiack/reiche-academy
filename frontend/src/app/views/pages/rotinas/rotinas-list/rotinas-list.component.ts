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
    
    this.rotinasService.findAll(this.pilarIdFiltro || undefined).subscribe({
      next: (rotinas) => {
        this.rotinas = rotinas;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.showToast(error?.error?.message || 'Erro ao carregar rotinas. Tente novamente.', 'error');
        this.loading = false;
        console.error('Erro ao carregar rotinas:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.rotinas];
    
    // Aplicar filtro de busca por nome/descrição
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(rotina => 
        rotina.nome.toLowerCase().includes(query) ||
        (rotina.descricao && rotina.descricao.toLowerCase().includes(query))
      );
    }
    
    this.rotinasFiltered = filtered;
    this.page = 1; // Resetar para primeira página ao filtrar
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

  getStartIndex(): number {
    if (this.rotinasFiltered.length === 0) return 0;
    return (this.page - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const end = this.page * this.pageSize;
    return Math.min(end, this.rotinasFiltered.length);
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
        this.showToast(error?.error?.message || 'Erro ao reordenar rotinas', 'error');
        console.error('Erro ao reordenar:', error);
      }
    });
  }

  confirmarExclusao(rotina: Rotina): void {
    // Buscar detalhes da rotina (empresas usando)
    this.rotinasService.findOne(rotina.id).subscribe({
      next: (rotinaDetalhada) => {
        const empresasUsando = rotinaDetalhada._count?.empresas || 0;
        
        if (empresasUsando > 0) {
          // Se houver empresas, permitir apenas desativação
          Swal.fire({
            title: 'Rotina em Uso',
            html: `
              <span class="text-muted">Esta rotina está sendo usada por <strong>${empresasUsando} empresa(s)</strong>.<br><br>
              Não é possível excluí-la permanentemente, mas você pode <strong>desativá-la</strong>.<br><br>
              Deseja desativar a rotina <strong>"${rotina.nome}"</strong>?</span>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sim, desativar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
          }).then((result) => {
            if (result.isConfirmed) {
              this.excluir(rotina.id);
            }
          });
          return;
        }

        // Permitir exclusão permanente se não houver vínculos
        Swal.fire({
          title: 'Confirmar Exclusão Permanente',
          html: `
            <span class="text-muted">Tem certeza que deseja <strong>excluir permanentemente</strong> a rotina <strong>"${rotina.nome}"</strong>?</span><br><br>
            <span class="text-danger">Esta ação não pode ser desfeita!</span>
          `,
          showCancelButton: true,
          confirmButtonText: 'Sim, excluir permanentemente',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#d33',
          cancelButtonColor: '#6c757d',
        }).then((result) => {
          if (result.isConfirmed) {
            this.excluir(rotina.id);
          }
        });
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao verificar rotina', 'error');
      }
    });
  }

  excluir(id: string): void {
    this.rotinasService.remove(id).subscribe({
      next: (response) => {
        // Verificar se foi desativado ou excluído baseado no response
        const mensagem = response.ativo === false 
          ? 'Rotina desativada com sucesso' 
          : 'Rotina excluída com sucesso';
        this.showToast(mensagem, 'success');
        this.loadRotinas();
      },
      error: (err) => {
        const message = err?.error?.message || 'Erro ao excluir rotina';
        this.showToast(message, 'error');
      }
    });
  }

  toggleStatus(id: string, nome: string, ativo: boolean): void {
    const action = ativo ? 'inativar' : 'ativar';
    const actionCapitalized = ativo ? 'Inativar' : 'Ativar';
    
    Swal.fire({
      title: `Confirmar ${actionCapitalized}`,
      text: `Deseja ${action} a rotina "${nome}"?`,
      showCancelButton: true,
      confirmButtonText: actionCapitalized,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: ativo ? '#dc3545' : '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        const service$ = ativo 
          ? this.rotinasService.desativar(id)
          : this.rotinasService.reativar(id);
        
        service$.subscribe({
          next: () => {
            this.showToast(`Rotina ${ativo ? 'inativada' : 'ativada'} com sucesso`, 'success');
            this.loadRotinas();
          },
          error: (err: any) => {
            const message = err?.error?.message || `Erro ao ${action} rotina`;
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
      error: (err) => {
        this.loadingDetails = false;
        this.showToast(err?.error?.message || 'Erro ao carregar detalhes', 'error');
      }
    });
  }
}
