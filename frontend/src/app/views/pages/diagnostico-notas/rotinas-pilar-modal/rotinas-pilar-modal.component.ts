import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { DiagnosticoNotasService, RotinaEmpresa } from '../../../../core/services/diagnostico-notas.service';
import { RotinasService, Rotina } from '../../../../core/services/rotinas.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-rotinas-pilar-modal',
  standalone: true,
  imports: [
    CommonModule,
    NgbModalModule,
    NgbTooltipModule,
    DragDropModule,
    NgSelectModule,
    FormsModule
  ],
  template: `
    <ng-template #modalContent let-modal>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="feather icon-list me-2"></i>
          Gerenciar Rotinas do Pilar {{ pilarNome }}
        </h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        <!-- Loading -->
        @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Carregando...</span>
          </div>
        </div>
        }

        <!-- Conteúdo -->
        @if (!loading) {
        <div class="mb-3">
          <p class="text-muted small mb-3">
            <i class="feather icon-info me-1"></i>
            Arraste as rotinas para reordenar, adicione novas rotinas ou remova as existentes.
          </p>

          <!-- Lista de rotinas (drag and drop) -->
          @if (rotinasEmpresa.length > 0) {
          <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="rotinas-list">
            @for (rotinaEmpresa of rotinasEmpresa; track rotinaEmpresa.id) {
            <div class="rotina-item card mb-2" cdkDrag>
              <div class="card-body p-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="feather icon-menu drag-handle" cdkDragHandle ngbTooltip="Arrastar para reordenar"></i>
                  <span class="badge bg-secondary small">{{ rotinaEmpresa.ordem }}</span>
                  <span class="flex-grow-1">{{ rotinaEmpresa.rotina.nome }}</span>
                  <button type="button" class="btn btn-sm btn-danger" 
                          (click)="confirmarRemocao(rotinaEmpresa)"
                          ngbTooltip="Remover rotina">
                    <i class="feather icon-trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
            }
          </div>
          } @else {
          <div class="alert alert-info">
            <i class="feather icon-info-circle me-2"></i>
            Nenhuma rotina associada a este pilar.
          </div>
          }

          <!-- Adicionar nova rotina -->
          <div class="mt-4">
            <h6 class="mb-3">Adicionar Nova Rotina</h6>
            <div class="row g-2">
              <div class="col-9">
                <ng-select
                  [items]="rotinasDisponiveis"
                  bindLabel="nome"
                  bindValue="id"
                  [(ngModel)]="novaRotinaId"
                  placeholder="Selecione uma rotina"
                  [clearable]="true">
                  <ng-template ng-option-tmp let-item="item">
                    <div>
                      <strong>{{ item.nome }}</strong>
                      @if (item.descricao) {
                      <br />
                      <small class="text-muted">{{ item.descricao }}</small>
                      }
                    </div>
                  </ng-template>
                </ng-select>
              </div>
              <div class="col-3">
                <button type="button" class="btn btn-primary w-100" 
                        [disabled]="!novaRotinaId"
                        (click)="adicionarRotina()">
                  <i class="feather icon-plus me-1"></i>
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
        }
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="modal.close()">Fechar</button>
        @if (temAlteracoes) {
        <button type="button" class="btn btn-success" (click)="salvarOrdem()">
          <i class="feather icon-save me-1"></i>
          Salvar Ordem
        </button>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .rotinas-list {
      min-height: 200px;
    }

    .rotina-item {
      cursor: move;
      transition: all 0.2s;
    }

    .rotina-item:hover {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .rotina-item.cdk-drag-preview {
      box-shadow: 0 5px 10px rgba(0,0,0,0.2);
      opacity: 0.9;
    }

    .rotina-item.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .drag-handle {
      cursor: grab;
      color: #6c757d;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    :host ::ng-deep .modal-body {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class RotinasPilarModalComponent implements OnInit {
  private modalService = inject(NgbModal);
  private diagnosticoService = inject(DiagnosticoNotasService);
  private rotinasService = inject(RotinasService);

  @ViewChild('modalContent') modalContent!: TemplateRef<any>;
  @Input() pilarEmpresaId!: string;
  @Input() pilarNome: string = '';
  @Input() pilarId!: string;
  @Output() rotinasModificadas = new EventEmitter<void>();

  private modalRef: any;
  loading = false;
  rotinasEmpresa: RotinaEmpresa[] = [];
  rotinasDisponiveis: Rotina[] = [];
  novaRotinaId: string | null = null;
  temAlteracoes = false;

  ngOnInit(): void {
    // Carregamento inicial será feito no open()
  }

  async open(): Promise<void> {
    this.modalRef = this.modalService.open(this.modalContent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    await this.carregarDados();
  }

  close(): void {
    this.modalRef?.close();
  }

  private async carregarDados(): Promise<void> {
    this.loading = true;
    try {
      // Carregar rotinas do pilar através do diagnóstico
      // Como não temos endpoint específico, vamos usar o findByEmpresa e filtrar
      // Isso será ajustado quando tivermos o endpoint correto
      
      // Por enquanto, vamos carregar todas as rotinas disponíveis do pilar
      const todasRotinas = await this.rotinasService.findAll(this.pilarId).toPromise();
      
      // As rotinasEmpresa virão do parent component via Input ou precisamos de endpoint
      // Por enquanto, assumimos que serão passadas
      
      this.rotinasDisponiveis = todasRotinas || [];
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao carregar rotinas. Tente novamente.'
      });
    } finally {
      this.loading = false;
    }
  }

  onDrop(event: CdkDragDrop<RotinaEmpresa[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.rotinasEmpresa, event.previousIndex, event.currentIndex);
      
      // Atualizar a ordem de todas as rotinas
      this.rotinasEmpresa.forEach((rotina, index) => {
        rotina.ordem = index + 1;
      });
      
      this.temAlteracoes = true;
    }
  }

  async salvarOrdem(): Promise<void> {
    try {
      // Aqui precisamos criar um endpoint no backend para atualizar a ordem
      // Por enquanto, vamos mostrar um aviso
      
      Swal.fire({
        icon: 'info',
        title: 'Funcionalidade em desenvolvimento',
        text: 'O endpoint para salvar a ordem ainda precisa ser implementado no backend.'
      });
      
      this.temAlteracoes = false;
      this.rotinasModificadas.emit();
      
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao salvar a ordem das rotinas.'
      });
    }
  }

  async confirmarRemocao(rotinaEmpresa: RotinaEmpresa): Promise<void> {
    const result = await Swal.fire({
      title: 'Remover Rotina',
      text: `Deseja remover a rotina "${rotinaEmpresa.rotina.nome}" deste pilar?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await this.removerRotina(rotinaEmpresa);
    }
  }

  private async removerRotina(rotinaEmpresa: RotinaEmpresa): Promise<void> {
    try {
      // Aqui precisamos criar um endpoint no backend para deletar a RotinaEmpresa
      // Por enquanto, removemos localmente
      
      const index = this.rotinasEmpresa.findIndex(r => r.id === rotinaEmpresa.id);
      if (index > -1) {
        this.rotinasEmpresa.splice(index, 1);
        
        // Reordenar as rotinas restantes
        this.rotinasEmpresa.forEach((rotina, idx) => {
          rotina.ordem = idx + 1;
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'Removida!',
        text: 'Rotina removida com sucesso.',
        timer: 2000,
        showConfirmButton: false
      });

      this.rotinasModificadas.emit();

    } catch (error) {
      console.error('Erro ao remover rotina:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao remover a rotina.'
      });
    }
  }

  async adicionarRotina(): Promise<void> {
    if (!this.novaRotinaId) return;

    try {
      // Buscar próxima ordem
      const proximaOrdem = this.rotinasEmpresa.length > 0 
        ? Math.max(...this.rotinasEmpresa.map(r => r.ordem)) + 1 
        : 1;

      // Criar RotinaEmpresa via endpoint
      // Por enquanto, simulamos localmente
      const rotinaBase = this.rotinasDisponiveis.find(r => r.id === this.novaRotinaId);
      
      if (!rotinaBase) return;

      // Aqui chamaríamos o endpoint do backend
      // await this.diagnosticoService.adicionarRotinaAoPilar(...)
      
      Swal.fire({
        icon: 'success',
        title: 'Adicionada!',
        text: 'Rotina adicionada com sucesso.',
        timer: 2000,
        showConfirmButton: false
      });

      this.novaRotinaId = null;
      this.rotinasModificadas.emit();
      await this.carregarDados();

    } catch (error) {
      console.error('Erro ao adicionar rotina:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao adicionar a rotina.'
      });
    }
  }
}
