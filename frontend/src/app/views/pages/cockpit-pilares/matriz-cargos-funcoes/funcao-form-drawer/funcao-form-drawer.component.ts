import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { Criticidade, FuncaoCargo } from '@core/interfaces/cockpit-pilares.interface';

@Component({
  selector: 'app-funcao-form-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title">
          <i class="bi bi-list-task me-2"></i>
          {{ isEditMode ? 'Editar Função' : 'Nova Função' }}
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto">
        @if (cargoNome) {
        <div class="alert alert-info mb-3">
          <i class="bi bi-people me-1"></i>
          Cargo: <strong>{{ cargoNome }}</strong>
        </div>
        }
        <div class="mb-3">
          <label class="form-label">
            Descrição <span class="text-danger">*</span>
          </label>
          <textarea
            class="form-control"
            rows="3"
            formControlName="descricao"
            [class.is-invalid]="form.get('descricao')?.invalid && form.get('descricao')?.touched"
          ></textarea>
          @if (form.get('descricao')?.invalid && form.get('descricao')?.touched) {
            <div class="invalid-feedback d-block">Descrição é obrigatória</div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Criticidade</label>
          <select class="form-select" formControlName="nivelCritico">
            @for (nivel of criticidadeOptions; track nivel.value) {
              <option [value]="nivel.value">{{ nivel.label }}</option>
            }
          </select>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Auto-avaliação</label>
            <input type="number" class="form-control" formControlName="autoAvaliacao" min="0" max="10" />
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Avaliação liderança</label>
            <input type="number" class="form-control" formControlName="avaliacaoLideranca" min="0" max="10" />
          </div>
        </div>
      </div>

      <div class="offcanvas-footer border-top p-3 flex-shrink-0 bg-light mt-auto">
        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-secondary" (click)="fechar()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="salvar()"
            [disabled]="form.invalid || saving"
          >
            @if (saving) {
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            }
            {{ isEditMode ? 'Atualizar Função' : 'Adicionar Função' }}
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .offcanvas-body {
        min-height: 0;
        flex: 1 1 auto;
        overflow: auto;
      }
      .offcanvas-footer {
        background-color: var(--bs-body-bg);
        margin-top: auto;
        position: sticky;
        bottom: 0;
        z-index: 1;
      }
    `,
  ],
})
export class FuncaoFormDrawerComponent {
  private fb = inject(FormBuilder);
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private cockpitService = inject(CockpitPilaresService);

  @Input() cargoId!: string;
  @Input() cargoNome?: string;
  @Input() set funcaoParaEditar(value: FuncaoCargo | undefined) {
    if (value) {
      this.isEditMode = true;
      this.funcaoId = value.id;
      this.form.patchValue({
        descricao: value.descricao,
        nivelCritico: value.nivelCritico,
        autoAvaliacao: value.autoAvaliacao ?? null,
        avaliacaoLideranca: value.avaliacaoLideranca ?? null,
      });
    }
  }
  @Output() funcaoSalva = new EventEmitter<FuncaoCargo>();

  saving = false;
  isEditMode = false;
  funcaoId: string | null = null;

  criticidadeOptions = [
    { value: Criticidade.ALTA, label: 'ALTA' },
    { value: Criticidade.MEDIA, label: 'MÉDIA' },
    { value: Criticidade.BAIXA, label: 'BAIXA' },
  ];

  form = this.fb.group({
    descricao: ['', [Validators.required, Validators.minLength(3)]],
    nivelCritico: [Criticidade.ALTA, Validators.required],
    autoAvaliacao: [null as number | null],
    avaliacaoLideranca: [null as number | null],
  });

  fechar(): void {
    this.activeOffcanvas.dismiss();
  }

  salvar(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const dto = {
      descricao: this.form.value.descricao || '',
      nivelCritico: this.form.value.nivelCritico || Criticidade.ALTA,
      autoAvaliacao: this.form.value.autoAvaliacao ?? null,
      avaliacaoLideranca: this.form.value.avaliacaoLideranca ?? null,
    };

    const request$ = this.isEditMode && this.funcaoId
      ? this.cockpitService.updateFuncaoCargo(this.funcaoId, dto)
      : this.cockpitService.createFuncaoCargo(this.cargoId, dto);

    request$.subscribe({
      next: (funcao) => {
        this.funcaoSalva.emit(funcao);
        this.saving = false;
        this.activeOffcanvas.close();
      },
      error: (err) => {
        console.error('Erro ao salvar função:', err);
        this.showToast('Erro ao salvar função', 'error');
        this.saving = false;
      },
    });
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer = 3000): void {
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
}
