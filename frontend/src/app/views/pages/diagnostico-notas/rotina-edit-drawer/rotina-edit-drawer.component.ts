import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { RotinasEmpresaService, RotinaEmpresa } from '@core/services/rotinas-empresa.service';
import { PilarEmpresa } from '@core/services/pilares-empresa.service';
import { TranslatePipe } from "../../../../core/pipes/translate.pipe";

@Component({
  selector: 'app-rotina-edit-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TranslatePipe],
  template: `
    <div class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title" data-testid="rotina-edit-title">
          <i class="feather icon-edit me-2"></i>
          Editar Rotinas
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto">
        @if (loading) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
          </div>
        } @else {
          @if (pilarEmpresa) {
            <div class="alert alert-info mb-3">
              <i class="feather icon-layers me-2"></i>
              <strong>Pilar:</strong> {{ pilarEmpresa.nome }}
            </div>
          }

          <!-- Lista de Rotinas com Drag & Drop -->
          <div class="mb-3">
            <label class="form-label d-flex align-items-center">
              <i class="feather icon-move me-2"></i>
              Reordenar Rotinas
              <small class="text-muted ms-2">(arraste para reordenar)</small>
            </label>
            
            <div
              cdkDropList
              (cdkDropListDropped)="onDrop($event)"
              class="rotinas-list"
            >
              @for (rotina of rotinas; track rotina.id) {
                <div class="rotina-item" cdkDrag>
                  <div cdkDragHandle class="d-flex align-items-start gap-2" style="cursor: move;">
                    <!-- Drag Handle -->
                    <div class="drag-handle" >
                      <i class="feather icon-menu"></i>
                    </div>

                    <!-- Ordem -->
                    <span class="badge bg-secondary mt-1">{{ rotina.ordem }}</span>

                    <!-- Nome (editável inline) -->
                    @if (editandoRotinaId === rotina.id) {
                      <textarea
                        class="form-control form-control-sm flex-grow-1"
                        [(ngModel)]="nomeEditando"
                        (keyup.enter)="salvarNome(rotina)"
                        (keyup.escape)="cancelarEdicao()"
                        [ngModelOptions]="{standalone: true}"
                        rows="2"
                        autofocus
                      ></textarea>
                      <button
                        class="btn btn-sm btn-success"
                        (click)="salvarNome(rotina)"
                        [disabled]="nomeEditando.trim().length < 3"
                      >
                        <i class="feather icon-check"></i>
                      </button>
                      <button
                        class="btn btn-sm btn-secondary"
                        (click)="cancelarEdicao()"
                      >
                        <i class="feather icon-x"></i>
                      </button>
                    } @else {
                      <span class="flex-grow-1 rotina-nome">{{ rotina.nome }}</span>
                      
                      <button data-testid="edit-cargo-button" class="btn btn-icon text-secondary"
                        (click)="iniciarEdicao(rotina)" [title]="'BUTTONS.EDIT' | translate">
                        <i class="feather icon-edit"></i>
                      </button>
                      <button data-testid="delete-cargo-button" class="btn btn-icon text-danger"
                        (click)="removerRotina(rotina)" [title]="'BUTTONS.DELETE' | translate">
                        <i class="feather icon-trash-2"></i>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            @if (rotinas.length === 0) {
              <div class="alert alert-info">
                <i class="feather icon-info me-2"></i>
                Nenhuma rotina associada a este pilar.
              </div>
            }
          </div>
        }
      </div>

      <div class="offcanvas-footer border-top p-3 flex-shrink-0 bg-light">
        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-secondary" (click)="fechar()">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .offcanvas-footer {
      background-color: var(--bs-body-bg);
    }

    .rotinas-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .rotina-item {
      background: var(--bs-tertiary-bg);
      border: 1px solid var(--bs-border-color);
      border-radius: 0.375rem;
      padding: 0.75rem;
      transition: all 0.2s;
    }

    .rotina-item:hover {
      background: var(--bs-secondary-bg);
      box-shadow: var(--bs-box-shadow-sm);
    }

    .rotina-item.cdk-drag-preview {
      box-shadow: var(--bs-box-shadow-lg);
      opacity: 0.8;
    }

    .rotina-item.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .drag-handle {
      cursor: move;
      color: var(--bs-secondary-color);
      padding: 0.25rem;
    }

    .drag-handle:hover {
      color: var(--bs-body-color);
    }

    .rotina-nome {
      font-weight: 400;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `]
})
export class RotinaEditDrawerComponent implements OnInit {
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private rotinasEmpresaService = inject(RotinasEmpresaService);

  @Input() empresaId!: string;
  @Input() pilarEmpresa!: PilarEmpresa;
  @Output() rotinasModificadas = new EventEmitter<void>();

  rotinas: RotinaEmpresa[] = [];
  loading = false;
  editandoRotinaId: string | null = null;
  nomeEditando: string = '';

  ngOnInit(): void {
    this.loadRotinas();
  }

  private loadRotinas(): void {
    this.loading = true;
    this.rotinasEmpresaService.listarRotinas(this.empresaId, this.pilarEmpresa.id).subscribe({
      next: (rotinas: RotinaEmpresa[]) => {
        this.rotinas = rotinas;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar rotinas:', err);
        this.showToast(err?.error?.message || 'Erro ao carregar rotinas', 'error');
        this.loading = false;
      }
    });
  }

  fechar(): void {
    this.activeOffcanvas.close();
  }

  iniciarEdicao(rotina: RotinaEmpresa): void {
    this.editandoRotinaId = rotina.id;
    this.nomeEditando = rotina.nome;
  }

  cancelarEdicao(): void {
    this.editandoRotinaId = null;
    this.nomeEditando = '';
  }

  salvarNome(rotina: RotinaEmpresa): void {
    const nomeNovo = this.nomeEditando.trim();

    if (nomeNovo.length < 3) {
      this.showToast('A descrição deve ter no mínimo 3 caracteres', 'error');
      return;
    }

    if (nomeNovo === rotina.nome) {
      this.cancelarEdicao();
      return;
    }

    this.rotinasEmpresaService.updateRotinaEmpresa(this.empresaId, this.pilarEmpresa.id, rotina.id, { nome: nomeNovo }).subscribe({
      next: (rotinaAtualizada: RotinaEmpresa) => {
        rotina.nome = rotinaAtualizada.nome;
        this.showToast('Descrição atualizada com sucesso!', 'success');
        this.cancelarEdicao();
        this.rotinasModificadas.emit();
      },
      error: (err: any) => {
        this.showToast(err?.error?.message || 'Erro ao atualizar descrição', 'error');
      }
    });
  }

  removerRotina(rotina: RotinaEmpresa): void {
    Swal.fire({
      title: 'Remover Rotina',
      html: `Deseja remover a rotina <strong>"${rotina.nome}"</strong>?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
        cancelButtonColor: 'var(--bs-secondary)',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rotinasEmpresaService.removerRotina(this.empresaId, this.pilarEmpresa.id, rotina.id).subscribe({
          next: () => {
            this.rotinas = this.rotinas.filter(r => r.id !== rotina.id);
            this.showToast('Rotina removida com sucesso!', 'success');
            this.rotinasModificadas.emit();
          },
          error: (err) => {
            this.showToast(err?.error?.message || 'Erro ao remover rotina', 'error');
          }
        });
      }
    });
  }

  onDrop(event: CdkDragDrop<RotinaEmpresa[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.rotinas, event.previousIndex, event.currentIndex);
      
      // Atualizar ordem
      this.rotinas.forEach((rotina, index) => {
        rotina.ordem = index + 1;
      });
      
      this.salvarOrdem();
    }
  }

  private async salvarOrdem(): Promise<void> {
    const novasOrdens = this.rotinas.map((r, idx) => ({
      id: r.id,
      ordem: idx + 1
    }));

    try {
      await this.rotinasEmpresaService.reordenarRotinas(this.empresaId, this.pilarEmpresa.id, novasOrdens).toPromise();
      this.showToast('Ordem atualizada com sucesso!', 'success');
      this.rotinasModificadas.emit();
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      const message = (error as any)?.error?.message || 'Erro ao salvar ordem';
      this.showToast(message, 'error');
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
