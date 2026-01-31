import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ProcessoFluxogramaService } from '@core/services/processo-fluxograma.service';
import {
  ProcessoFluxograma,
  ProcessoPrioritario,
} from '@core/interfaces/cockpit-pilares.interface';
import { AuthService } from '@core/services/auth.service';
import { TranslateService } from '@core/services/translate.service';
import { TranslatePipe } from '@core/pipes/translate.pipe';

@Component({
  selector: 'app-processo-fluxograma-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule, TranslatePipe],
  template: `
    <form [formGroup]="form" class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title">
          <i class="bi bi-diagram-3 me-0"></i>
          {{ 'PROCESSOS_FLUXOGRAMA.TITLE' | translate }}
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto">
        @if (processo) {
          <div class="alert alert-info mb-2">
            <i class="feather icon-layers me-2"></i>
            <strong>{{ 'PROCESSOS_FLUXOGRAMA.PROCESS_LABEL' | translate }}:</strong>
            {{ processo.rotinaEmpresa?.nome || ('PROCESSOS_FLUXOGRAMA.DEFAULT_PROCESS' | translate) }}
          </div>
        }

        @if (loading) {
          <div class="text-center py-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
            </div>
          </div>
        } @else {
          @if (acoes.length === 0) {
            <div class="alert alert-info mb-2">
              <i class="feather icon-info me-2"></i>
              {{ 'PROCESSOS_FLUXOGRAMA.EMPTY_STATE' | translate }}
            </div>
          } @else {
            <div class="mb-1 small">
              <!-- <label class="form-label d-flex align-items-center">
                <i class="feather icon-move me-2"></i>
                {{ 'PROCESSOS_FLUXOGRAMA.REORDER_TITLE' | translate }}
                <small class="text-muted ms-2">({{ 'PROCESSOS_FLUXOGRAMA.REORDER_HINT' | translate }})</small>
              </label> -->
              <div
                cdkDropList
                (cdkDropListDropped)="onDrop($event)"
                class="acoes-list"
              >
                @for (acao of acoes; track acao.id; let i = $index) {
                  <div class="acao-item" cdkDrag [cdkDragDisabled]="!canEdit">
                    <div cdkDragHandle class="d-flex align-items-start gap-2" style="cursor: move;">
                      <div class="drag-handle" [class.disabled]="!canEdit">
                        <i class="feather icon-menu"></i>
                      </div>

                      <span class="badge bg-secondary mt-1">{{ acao.ordem }}</span>

                      @if (editandoAcaoId === acao.id) {
                        <textarea
                          class="form-control form-control-sm flex-grow-1"
                          [formControl]="getDescricaoControl(i)"
                          rows="2"
                          autofocus
                        ></textarea>
                        <button
                          class="btn btn-sm btn-success"
                          (click)="salvarEdicao(i)"
                          [disabled]="acoesForm.at(i).invalid"
                        >
                          <i class="feather icon-check"></i>
                        </button>
                        <button
                          class="btn btn-sm btn-secondary"
                          (click)="cancelarEdicao(i)"
                        >
                          <i class="feather icon-x"></i>
                        </button>
                      } @else {
                        <span class="flex-grow-1 acao-descricao">
                          {{ acao.descricao }}
                        </span>
                        
                        <button data-testid="edit-cargo-button" class="btn btn-icon text-secondary"
                          (click)="iniciarEdicao(i)" [title]="'BUTTONS.EDIT' | translate">
                          <i class="feather icon-edit"></i>
                        </button>
                        <button data-testid="delete-cargo-button" class="btn btn-icon text-danger"
                          (click)="removerAcao(i)" [title]="'BUTTONS.DELETE' | translate">
                          <i class="feather icon-trash-2"></i>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>

      <div class="offcanvas-footer border-top px-3 py-2 flex-shrink-0 bg-light">
        <div class="mb-2">
          <label class="form-label">
            {{ 'PROCESSOS_FLUXOGRAMA.NEW_ACTION_LABEL' | translate }}
          </label>
          <textarea
            class="form-control"
            rows="2"
            formControlName="novaDescricao"
            [placeholder]="'PROCESSOS_FLUXOGRAMA.NEW_ACTION_PLACEHOLDER' | translate"
            [disabled]="!canEdit"
          ></textarea>
          @if (form.get('novaDescricao')?.invalid && form.get('novaDescricao')?.touched) {
            <small class="text-danger">
              {{ 'PROCESSOS_FLUXOGRAMA.VALIDATION_ERROR' | translate }}
            </small>
          }
        </div>

        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-secondary" (click)="fechar()">
            {{ 'BUTTONS.CANCEL' | translate }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="adicionarAcao()"
            [disabled]="form.get('novaDescricao')?.invalid || !canEdit || saving"
          >
            @if (saving) {
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            }
            {{ 'PROCESSOS_FLUXOGRAMA.ADD_ACTION' | translate }}
          </button>
        </div>
      </div>
    </form>
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

    .acoes-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .acao-item {
      background: var(--bs-tertiary-bg);
      border: 1px solid var(--bs-border-color);
      border-radius: 0.375rem;
      padding: 0.5rem;
      transition: all 0.2s;
    }

    .acao-item:hover {
      background: var(--bs-secondary-bg);
      box-shadow: var(--bs-box-shadow-sm);
    }

    .acao-item.cdk-drag-preview {
      box-shadow: var(--bs-box-shadow-lg);
      opacity: 0.8;
    }

    .acao-item.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .drag-handle {
      cursor: move;
      color: var(--bs-secondary-color);
      padding: 0.25rem;
    }

    .drag-handle.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .acao-descricao {
      font-weight: 400;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `],
})
export class ProcessoFluxogramaDrawerComponent implements OnInit {
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private fluxogramaService = inject(ProcessoFluxogramaService);
  private authService = inject(AuthService);
  private translateService = inject(TranslateService);
  private fb = inject(FormBuilder);

  @Input() processo!: ProcessoPrioritario;
  @Output() fluxogramaAtualizado = new EventEmitter<number>();

  acoes: ProcessoFluxograma[] = [];
  loading = false;
  saving = false;
  editandoAcaoId: string | null = null;
  canEdit = false;

  form = this.fb.group({
    novaDescricao: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(300)],
    ],
    acoes: this.fb.array([]),
  });

  get acoesForm(): FormArray {
    return this.form.get('acoes') as FormArray;
  }

  getDescricaoControl(index: number): FormControl {
    return this.acoesForm.at(index).get('descricao') as FormControl;
  }

  ngOnInit(): void {
    this.definirPermissao();
    this.loadAcoes();
  }

  fechar(): void {
    this.activeOffcanvas.close();
  }

  private definirPermissao(): void {
    const user = this.authService.getCurrentUser();
    const perfil = user?.perfil;
    const codigo = typeof perfil === 'object' ? perfil?.codigo : perfil;
    this.canEdit = ['ADMINISTRADOR', 'GESTOR', 'COLABORADOR'].includes(
      codigo || '',
    );
  }

  private loadAcoes(): void {
    if (!this.processo?.id) return;

    this.loading = true;
    this.fluxogramaService.listarAcoes(this.processo.id).subscribe({
      next: (acoes) => {
        this.acoes = acoes;
        this.montarFormularioAcoes();
        this.emitirAtualizacao();
        this.loading = false;
      },
      error: () => {
        this.showToast('PROCESSOS_FLUXOGRAMA.ERROR_LOAD', 'error');
        this.loading = false;
      },
    });
  }

  private montarFormularioAcoes(): void {
    this.acoesForm.clear();
    this.acoes.forEach((acao) => {
      this.acoesForm.push(
        this.fb.group({
          descricao: [
            acao.descricao,
            [
              Validators.required,
              Validators.minLength(10),
              Validators.maxLength(300),
            ],
          ],
        }),
      );
    });
  }

  adicionarAcao(): void {
    if (!this.canEdit) return;

    const descricao = this.form.get('novaDescricao')?.value?.trim();

    if (!descricao || descricao.length < 10 || descricao.length > 300) {
      this.showToast('PROCESSOS_FLUXOGRAMA.VALIDATION_ERROR', 'error');
      return;
    }

    this.saving = true;
    this.fluxogramaService
      .criarAcao(this.processo.id, { descricao })
      .subscribe({
        next: (acao) => {
          this.acoes.push(acao);
          this.acoesForm.push(
            this.fb.group({
              descricao: [acao.descricao, [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
            }),
          );
          this.form.get('novaDescricao')?.reset('');
          this.showToast('PROCESSOS_FLUXOGRAMA.ACTION_CREATED', 'success');
          this.emitirAtualizacao();
          this.saving = false;
        },
        error: (err) => {
          this.showToast(
            err?.error?.message || 'PROCESSOS_FLUXOGRAMA.ERROR_CREATE',
            'error',
          );
          this.saving = false;
        },
      });
  }

  iniciarEdicao(index: number): void {
    if (!this.canEdit) return;
    const acao = this.acoes[index];
    this.editandoAcaoId = acao?.id || null;
  }

  cancelarEdicao(index: number): void {
    const acao = this.acoes[index];
    if (!acao) return;

    this.acoesForm.at(index).get('descricao')?.setValue(acao.descricao);
    this.editandoAcaoId = null;
  }

  salvarEdicao(index: number): void {
    if (!this.canEdit) return;

    const acao = this.acoes[index];
    const descricao = this.acoesForm.at(index).get('descricao')?.value?.trim();

    if (!acao || !descricao || descricao.length < 10 || descricao.length > 300) {
      this.showToast('PROCESSOS_FLUXOGRAMA.VALIDATION_ERROR', 'error');
      return;
    }

    this.fluxogramaService
      .atualizarAcao(this.processo.id, acao.id, { descricao })
      .subscribe({
        next: (acaoAtualizada) => {
          this.acoes[index].descricao = acaoAtualizada.descricao;
          this.showToast('PROCESSOS_FLUXOGRAMA.ACTION_UPDATED', 'success');
          this.editandoAcaoId = null;
        },
        error: (err) => {
          this.showToast(
            err?.error?.message || 'PROCESSOS_FLUXOGRAMA.ERROR_UPDATE',
            'error',
          );
        },
      });
  }

  async removerAcao(index: number): Promise<void> {
    if (!this.canEdit) return;

    const acao = this.acoes[index];
    if (!acao) return;

    const result = await Swal.fire({
      title: this.getTranslation('PROCESSOS_FLUXOGRAMA.CONFIRM_DELETE_TITLE'),
      html: this.getTranslation('PROCESSOS_FLUXOGRAMA.CONFIRM_DELETE_TEXT'),
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: 'var(--bs-secondary)',
      confirmButtonText: this.getTranslation('BUTTONS.DELETE'),
      cancelButtonText: this.getTranslation('BUTTONS.CANCEL'),
    });

    if (!result.isConfirmed) return;

    this.fluxogramaService.removerAcao(this.processo.id, acao.id).subscribe({
      next: () => {
        this.acoes.splice(index, 1);
        this.acoesForm.removeAt(index);
        this.showToast('PROCESSOS_FLUXOGRAMA.ACTION_REMOVED', 'success');
        this.recalcularOrdens();
        if (this.acoes.length > 0) {
          this.persistirOrdem();
        } else {
          this.emitirAtualizacao();
        }
      },
      error: (err) => {
        this.showToast(
          err?.error?.message || 'PROCESSOS_FLUXOGRAMA.ERROR_DELETE',
          'error',
        );
      },
    });
  }

  onDrop(event: CdkDragDrop<ProcessoFluxograma[]>): void {
    if (!this.canEdit) return;

    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.acoes, event.previousIndex, event.currentIndex);
      const control = this.acoesForm.at(event.previousIndex);
      this.acoesForm.removeAt(event.previousIndex);
      this.acoesForm.insert(event.currentIndex, control);
      this.recalcularOrdens();
      this.persistirOrdem();
    }
  }

  private recalcularOrdens(): void {
    this.acoes.forEach((acao, index) => {
      acao.ordem = index + 1;
    });
  }

  private persistirOrdem(): void {
    if (!this.canEdit || this.acoes.length === 0) return;

    const ids = new Set<string>();
    for (const acao of this.acoes) {
      if (!acao?.id) {
        this.showToast('PROCESSOS_FLUXOGRAMA.ERROR_REORDER', 'error');
        return;
      }
      ids.add(acao.id);
    }

    if (ids.size !== this.acoes.length) {
      this.showToast('PROCESSOS_FLUXOGRAMA.ERROR_REORDER', 'error');
      return;
    }

    const ordens = this.acoes.map((acao, index) => ({
      id: acao.id,
      ordem: index + 1,
    }));

    this.fluxogramaService
      .reordenarAcoes(this.processo.id, { ordens })
      .subscribe({
        next: () => {
          this.showToast('PROCESSOS_FLUXOGRAMA.ORDER_UPDATED', 'success');
        },
        error: (err) => {
          this.showToast(
            err?.error?.message || 'PROCESSOS_FLUXOGRAMA.ERROR_REORDER',
            'error',
          );
          this.loadAcoes();
        },
      });
  }

  private emitirAtualizacao(): void {
    this.fluxogramaAtualizado.emit(this.acoes.length);
  }

  private showToast(
    key: string,
    icon: 'success' | 'error' | 'info' | 'warning',
    timer: number = 3000,
  ): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      title: this.getTranslation(key),
      icon,
    });
  }

  private getTranslation(key: string): string {
    return this.translateService.instant(key);
  }
}
