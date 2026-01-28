import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { DiagnosticoNotasService, RotinaEmpresa, PilarEmpresa } from '../../../../core/services/diagnostico-notas.service';
import { RotinasService, Rotina } from '../../../../core/services/rotinas.service';
import { RotinasEmpresaService } from '../../../../core/services/rotinas-empresa.service';
import { NovaRotinaModalComponent } from '../nova-rotina-modal/nova-rotina-modal.component';
import { TranslatePipe } from "../../../../core/pipes/translate.pipe";

@Component({
  selector: 'app-rotinas-pilar-modal',
  standalone: true,
  imports: [
    CommonModule,
    NgbModalModule,
    NgbTooltipModule,
    DragDropModule,
    NgSelectModule,
    FormsModule,
    NovaRotinaModalComponent,
    TranslatePipe
],
  template: `
    <ng-template #modalContent let-modal>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="feather icon-list me-2"></i>
          {{'PILARES.PILAR' | translate}} {{ pilarNome }}
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
          <div class="d-flex justify-content-between align-items-center mb-3">
            <p class="text-muted small mb-0">
              <i class="feather icon-info me-1"></i>
              Arraste as rotinas para reordenar, adicione novas rotinas ou remova as existentes.
            </p>
            <button type="button" class="btn btn-primary btn-sm" 
                    (click)="abrirModalNovaRotina(); $event.preventDefault()">
              <i class="bi bi-plus-circle me-1"></i>
              Adicionar Rotina
            </button>
          </div>

          <!-- Lista de rotinas (drag and drop) -->
          @if (rotinasEmpresa.length > 0) {
          <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="rotinas-list">
            @for (rotinaEmpresa of rotinasEmpresa; track rotinaEmpresa.id) {
            <div class="rotina-item card mb-2" cdkDrag>
              <div class="card-body p-2">
                <div class="d-flex align-items-center gap-2" cdkDragHandle>
                  <i class="bi bi-grip-vertical drag-handle" ngbTooltip="Arrastar para reordenar"></i>
                  <span class="badge bg-secondary small">{{ rotinaEmpresa.ordem }}</span>
                  
                  @if (editandoRotinaId === rotinaEmpresa.id) {
                    <input 
                      type="text" 
                      class="form-control form-control-sm flex-grow-1" 
                      [(ngModel)]="nomeEditando"
                      (keydown.enter)="salvarNomeRotina(rotinaEmpresa)"
                      (keydown.escape)="cancelarEdicaoNome()"
                      [maxlength]="200"
                      autofocus
                    />
                    <button type="button" class="btn btn-sm btn-success" (click)="salvarNomeRotina(rotinaEmpresa)" title="Salvar">
                      <i class="feather icon-check"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-secondary" (click)="cancelarEdicaoNome()" title="Cancelar">
                      <i class="feather icon-x"></i>
                    </button>
                  } @else {
                    <span class="flex-grow-1 small">{{ rotinaEmpresa.nome.toUpperCase() }}</span>
                    <button type="button" class="btn btn-icon text-primary" (click)="iniciarEdicaoNome(rotinaEmpresa)" title="Editar nome">
                      <i class="feather icon-edit-2"></i>
                    </button>
                  }
                  
                  <button type="button" class="btn btn-icon text-danger"
                        (click)="confirmarRemocao(rotinaEmpresa)" title="Remover rotina">
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

        </div>
        }
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="modal.close()">Fechar</button>
      </div>
    </ng-template>

    <!-- Modal de Nova Rotina -->
    <app-nova-rotina-modal [empresaId]="empresaId" (rotinaCriada)="onRotinaCriada()"></app-nova-rotina-modal>
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
  private rotinasEmpresaService = inject(RotinasEmpresaService);

  @ViewChild('modalContent') modalContent!: TemplateRef<any>;
  @ViewChild(NovaRotinaModalComponent) novaRotinaModal!: NovaRotinaModalComponent;
  @Input() empresaId!: string;
  @Input() pilarEmpresaId!: string;
  @Input() pilarNome: string = '';
  @Input() pilarId!: string;
  @Output() rotinasModificadas = new EventEmitter<void>();

  private modalRef: any;
  loading = false;
  rotinasEmpresa: RotinaEmpresa[] = [];
  rotinasDisponiveis: Rotina[] = [];
  novaRotinaId: string | null = null;
  editandoRotinaId: string | null = null;
  nomeEditando: string = '';

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
      // Carregar rotinas vinculadas ao pilar
      this.rotinasEmpresa = await this.diagnosticoService
        .listarRotinas(this.empresaId, this.pilarEmpresaId)
        .toPromise() || [];
      
      // Carregar todas as rotinas disponíveis do pilar para referência
      this.rotinasDisponiveis = await this.rotinasService.findAll(this.pilarId).toPromise() || [];
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      this.showToast('Erro ao carregar rotinas. Tente novamente', 'error');
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
      
      // Salvar automaticamente
      this.salvarOrdem();
    }
  }

  async salvarOrdem(): Promise<void> {
    try {
      const ordens = this.rotinasEmpresa.map(r => ({
        id: r.id,
        ordem: r.ordem
      }));

      await this.diagnosticoService.reordenarRotinas(
        this.empresaId,
        this.pilarEmpresaId,
        ordens
      ).toPromise();
      
      this.showToast('Ordem das rotinas atualizada com sucesso.', 'success');
      this.rotinasModificadas.emit();
      
    } catch (error) {
      this.showToast('Erro ao salvar a ordem das rotinas. Tente novamente', 'error');
    }
  }

  async confirmarRemocao(rotinaEmpresa: RotinaEmpresa): Promise<void> {
    const result = await Swal.fire({
      title: 'Remover Rotina',
      text: `Deseja remover a rotina "${rotinaEmpresa.nome}" deste pilar?`,
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
      await this.diagnosticoService.removerRotina(
        this.empresaId,
        this.pilarEmpresaId,
        rotinaEmpresa.id
      ).toPromise();

      this.showToast('Rotina removida com sucesso.', 'success');

      // Recarregar dados para refletir a remoção e reordenação automática
      await this.carregarDados();
      this.rotinasModificadas.emit();

    } catch (error) {
      this.showToast('Erro ao remover rotina. Tente novamente', 'error');
    }
  }

  /**
   * Abre modal de nova rotina customizada
   */
  abrirModalNovaRotina(): void {
    if (!this.novaRotinaModal) return;

    // Criar objeto PilarEmpresa para passar ao modal (usando campos snapshot)
    const pilarEmpresa: PilarEmpresa = {
      id: this.pilarEmpresaId,
      pilarTemplateId: this.pilarId,
      nome: this.pilarNome,
      empresaId: '', // Será preenchido pelo backend
      ordem: 0,
      ativo: true,
      rotinasEmpresa: this.rotinasEmpresa
    } as PilarEmpresa;

    this.novaRotinaModal.open(pilarEmpresa);
  }

  /**
   * Callback quando rotina é criada na modal de nova rotina
   * Recarrega a lista de rotinas para incluir a nova
   */
  async onRotinaCriada(): Promise<void> {
    await this.carregarDados();
    this.rotinasModificadas.emit();
  }

  /**
   * Inicia edição do nome da rotina
   */
  iniciarEdicaoNome(rotinaEmpresa: RotinaEmpresa): void {
    this.editandoRotinaId = rotinaEmpresa.id;
    this.nomeEditando = rotinaEmpresa.nome;
  }

  /**
   * Cancela edição do nome
   */
  cancelarEdicaoNome(): void {
    this.editandoRotinaId = null;
    this.nomeEditando = '';
  }

  /**
   * Salva o novo nome da rotina
   */
  async salvarNomeRotina(rotinaEmpresa: RotinaEmpresa): Promise<void> {
    const nomeNovo = this.nomeEditando.trim();

    // Validações
    if (nomeNovo.length < 2) {
      this.showToast('O nome da rotina deve ter no mínimo 2 caracteres', 'error');
      return;
    }

    if (nomeNovo.length > 200) {
      this.showToast('O nome da rotina deve ter no máximo 200 caracteres', 'error');
      return;
    }

    if (nomeNovo === rotinaEmpresa.nome) {
      this.cancelarEdicaoNome();
      return;
    }

    try {
      const rotinaAtualizada = await this.rotinasEmpresaService.updateRotinaEmpresa(
        this.empresaId,
        this.pilarEmpresaId,
        rotinaEmpresa.id,
        { nome: nomeNovo }
      ).toPromise();

      this.showToast(`Nome da rotina atualizado para "${nomeNovo}"`, 'success');
      
      // Atualizar na lista local
      const index = this.rotinasEmpresa.findIndex(r => r.id === rotinaEmpresa.id);
      if (index !== -1 && rotinaAtualizada) {
        this.rotinasEmpresa[index] = rotinaAtualizada as RotinaEmpresa;
      }
      
      this.cancelarEdicaoNome();
      this.rotinasModificadas.emit();
    } catch (error: any) {
      this.showToast(error?.error?.message || 'Erro ao atualizar nome da rotina', 'error');
    }
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
        title,
        icon
      });
    }
}
