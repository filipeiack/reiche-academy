import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { PilaresEmpresaService, PilarEmpresa } from '@core/services/pilares-empresa.service';
import { TranslatePipe } from "../../../../core/pipes/translate.pipe";

@Component({
  selector: 'app-pilar-edit-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TranslatePipe],
  template: `
    <div class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title">
          <i class="feather icon-edit me-2"></i>
          Editar Pilares
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
          <!-- Lista de Pilares com Drag & Drop -->
          <div class="mb-3">
            <label class="form-label d-flex align-items-center">
              <i class="feather icon-move me-2"></i>
              Reordenar Pilares
              <small class="text-muted ms-2">(arraste para reordenar)</small>
            </label>
            
            <div
              cdkDropList
              (cdkDropListDropped)="onDrop($event)"
              class="pilares-list"
            >
              @for (pilar of pilares; track pilar.id) {
                <div class="pilar-item" cdkDrag>
                  <div class="d-flex align-items-center gap-2" style="cursor: move;">
                    <!-- Drag Handle -->
                    <div class="drag-handle" cdkDragHandle>
                      <i class="feather icon-menu"></i>
                    </div>

                    <!-- Ordem -->
                    <span class="badge bg-secondary">{{ pilar.ordem }}</span>

                    <!-- Nome (editável inline) -->
                    @if (editandoPilarId === pilar.id) {
                      <input
                        type="text"
                        class="form-control form-control-sm flex-grow-1"
                        [(ngModel)]="nomeEditando"
                        (keyup.enter)="salvarNome(pilar)"
                        (keyup.escape)="cancelarEdicao()"
                        [ngModelOptions]="{standalone: true}"
                        autofocus
                      />
                      <button
                        class="btn btn-sm btn-success"
                        (click)="salvarNome(pilar)"
                        [disabled]="nomeEditando.trim().length < 2"
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
                      <span class="flex-grow-1 pilar-nome">{{ pilar.nome }}</span>
                      <button data-testid="edit-cargo-button" class="btn btn-icon text-secondary"
                        (click)="iniciarEdicao(pilar)" [title]="'BUTTONS.EDIT' | translate">
                        <i class="feather icon-edit"></i>
                      </button>
                      <button data-testid="delete-cargo-button" class="btn btn-icon text-danger"
                        (click)="removerPilar(pilar)" [title]="'BUTTONS.DELETE' | translate">
                        <i class="feather icon-trash-2"></i>
                      </button>
                    }
                  </div>


                </div>
              }
            </div>

            @if (pilares.length === 0) {
              <div class="alert alert-info">
                <i class="feather icon-info me-2"></i>
                Nenhum pilar associado a esta empresa.
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

    .pilares-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .pilar-item {
      background: var(--bs-tertiary-bg);
      border: 1px solid var(--bs-border-color);
      border-radius: 0.375rem;
      padding: 0.75rem;
      transition: all 0.2s;
    }

    .pilar-item:hover {
      background: var(--bs-secondary-bg);
      box-shadow: var(--bs-box-shadow-sm);
    }

    .pilar-item.cdk-drag-preview {
      box-shadow: var(--bs-box-shadow-lg);
      opacity: 0.8;
    }

    .pilar-item.cdk-drag-animating {
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

    .pilar-nome {
      font-weight: 500;
    }
  `]
})
export class PilarEditDrawerComponent implements OnInit {
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private pilaresEmpresaService = inject(PilaresEmpresaService);

  @Input() empresaId!: string;
  @Output() pilaresModificados = new EventEmitter<void>();

  pilares: PilarEmpresa[] = [];
  loading = false;
  editandoPilarId: string | null = null;
  nomeEditando: string = '';

  ngOnInit(): void {
    this.loadPilares();
  }

  private loadPilares(): void {
    this.loading = true;
    this.pilaresEmpresaService.listarPilaresDaEmpresa(this.empresaId).subscribe({
      next: (pilares) => {
        this.pilares = pilares;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar pilares:', err);
        this.showToast(err?.error?.message || 'Erro ao carregar pilares', 'error');
        this.loading = false;
      }
    });
  }

  fechar(): void {
    this.activeOffcanvas.close();
  }

  iniciarEdicao(pilar: PilarEmpresa): void {
    this.editandoPilarId = pilar.id;
    this.nomeEditando = pilar.nome;
  }

  cancelarEdicao(): void {
    this.editandoPilarId = null;
    this.nomeEditando = '';
  }

  salvarNome(pilar: PilarEmpresa): void {
    const nomeNovo = this.nomeEditando.trim();

    if (nomeNovo.length < 2) {
      this.showToast('O nome deve ter no mínimo 2 caracteres', 'error');
      return;
    }

    if (nomeNovo === pilar.nome) {
      this.cancelarEdicao();
      return;
    }

    this.pilaresEmpresaService.updatePilarEmpresa(this.empresaId, pilar.id, { nome: nomeNovo }).subscribe({
      next: (pilarAtualizado: PilarEmpresa) => {
        pilar.nome = pilarAtualizado.nome;
        this.showToast('Nome atualizado com sucesso!', 'success');
        this.cancelarEdicao();
        this.pilaresModificados.emit();
      },
      error: (err: any) => {
        this.showToast(err?.error?.message || 'Erro ao atualizar nome', 'error');
      }
    });
  }

  removerPilar(pilar: PilarEmpresa): void {
    Swal.fire({
      title: 'Remover Pilar',
      html: `Deseja remover o pilar <strong>${pilar.nome}</strong>?<br><small class="text-danger">Todas as rotinas associadas também serão removidas.</small>`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
        cancelButtonColor: 'var(--bs-secondary)',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pilaresEmpresaService.removerPilar(this.empresaId, pilar.id).subscribe({
          next: () => {
            this.pilares = this.pilares.filter(p => p.id !== pilar.id);
            this.showToast(`Pilar "${pilar.nome}" removido com sucesso!`, 'success');
            this.pilaresModificados.emit();
          },
          error: (err) => {
            this.showToast(err?.error?.message || 'Erro ao remover pilar', 'error');
          }
        });
      }
    });
  }

  onDrop(event: CdkDragDrop<PilarEmpresa[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.pilares, event.previousIndex, event.currentIndex);
      
      // Atualizar ordem
      this.pilares.forEach((pilar, index) => {
        pilar.ordem = index + 1;
      });
      
      this.salvarOrdem();
    }
  }

  private async salvarOrdem(): Promise<void> {
    const novasOrdens = this.pilares.map((p, idx) => ({
      id: p.id,
      ordem: idx + 1
    }));

    try {
      await this.pilaresEmpresaService.reordenarPilares(this.empresaId, novasOrdens).toPromise();
      this.showToast('Ordem atualizada com sucesso!', 'success');
      this.pilaresModificados.emit();
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
