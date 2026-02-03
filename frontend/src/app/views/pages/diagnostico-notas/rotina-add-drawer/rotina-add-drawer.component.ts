import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { RotinasEmpresaService, CreateRotinaEmpresaDto } from '@core/services/rotinas-empresa.service';
import { PilarEmpresa } from '@core/services/pilares-empresa.service';
import { TranslatePipe } from "../../../../core/pipes/translate.pipe";

@Component({
  selector: 'app-rotina-add-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title" data-testid="rotina-add-title">
          <i class="bi bi-plus-circle me-2"></i>
          Nova Rotina Customizada
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto">
        @if (pilarEmpresa) {
          <div class="alert alert-info mb-3">
            <i class="feather icon-layers me-2"></i>
            <strong>Pilar:</strong> {{ pilarEmpresa.nome }}
          </div>

          <form [formGroup]="form">
            <!-- Nome da Rotina -->
            <div class="mb-3">
              <label class="form-label">
                Descrição da Rotina <span class="text-danger">*</span>
              </label>
              <textarea
                class="form-control"
                formControlName="nome"
                data-testid="rotina-add-nome"
                rows="3"
                placeholder="Digite a descrição da rotina..."
                [class.is-invalid]="form.get('nome')?.invalid && form.get('nome')?.touched"
              ></textarea>
              @if (form.get('nome')?.invalid && form.get('nome')?.touched) {
                <div class="invalid-feedback d-block">
                  Descrição é obrigatória (mínimo 3 caracteres)
                </div>
              }
            </div>

            <div class="mb-3">
              <label class="form-label">
                {{ 'DIAGNOSTICO.CRITICIDADE' | translate }}
              </label>
              <select
                class="form-select"
                formControlName="criticidade"
                data-testid="rotina-add-criticidade"
              >
                <option value="">{{ 'DIAGNOSTICO.SELECT_CRITICIDADE' | translate }}</option>
                <option *ngFor="let criticidade of criticidades" [value]="criticidade.value">
                  {{ criticidade.label }}
                </option>
              </select>
            </div>

            <div class="alert alert-info">
              <i class="feather icon-info me-2"></i>
              <small>
                Este drawer permanecerá aberto para adicionar múltiplas rotinas rapidamente.
              </small>
            </div>
          </form>
        }
      </div>

      <div class="offcanvas-footer border-top p-3 flex-shrink-0 bg-light">
        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-secondary" (click)="fechar()" data-testid="rotina-add-cancel">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="salvar()"
            data-testid="rotina-add-submit"
            [disabled]="form.invalid || saving"
          >
            @if (saving) {
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            }
            Adicionar Rotina
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
  `]
})
export class RotinaAddDrawerComponent {
  private fb = inject(FormBuilder);
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private rotinasEmpresaService = inject(RotinasEmpresaService);

  @Input() empresaId!: string;
  @Input() pilarEmpresa!: PilarEmpresa;
  @Output() rotinaCriada = new EventEmitter<void>();

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    criticidade: [null],
  });

  criticidades = [
    { value: 'BAIXA', label: 'BAIXA' },
    { value: 'MEDIA', label: 'MÉDIA' },
    { value: 'ALTA', label: 'ALTA' },
  ];

  saving = false;

  fechar(): void {
    this.activeOffcanvas.dismiss();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto: CreateRotinaEmpresaDto = {
      nome: this.form.value.nome!,
      criticidade: this.form.value.criticidade || null,
    };

    this.saving = true;
    this.rotinasEmpresaService.criarRotinaEmpresa(this.empresaId, this.pilarEmpresa.id, dto).subscribe({
      next: (rotina) => {
        this.showToast(`Rotina "${rotina.nome}" criada com sucesso!`, 'success');
        this.rotinaCriada.emit();
        this.saving = false;
        
        // Limpar form e manter drawer aberto
        this.form.reset();
        this.form.markAsUntouched();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao criar rotina', 'error');
        this.saving = false;
      }
    });
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
