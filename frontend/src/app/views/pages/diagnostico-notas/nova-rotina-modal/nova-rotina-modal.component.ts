import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { RotinasEmpresaService, CreateRotinaEmpresaDto } from '../../../../core/services/rotinas-empresa.service';
import { PilarEmpresa } from '../../../../core/services/diagnostico-notas.service';

@Component({
  selector: 'app-nova-rotina-modal',
  standalone: true,
  imports: [CommonModule, NgbModalModule, ReactiveFormsModule],
  template: `
    <ng-template #modalContent let-modal>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="bi bi-plus-circle me-2"></i>
          Nova Rotina Customizada
        </h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        @if (pilarEmpresa) {
        <div class="mb-3">
          <p class="text-muted">
            <strong>Pilar:</strong> {{ pilarEmpresa.nome }}
          </p>
        </div>

        <form [formGroup]="form">
          <div class="mb-3">
            <label class="form-label">Descrição da sua Rotina <span class="text-danger">*</span></label>
            <textarea 
              class="form-control" 
              formControlName="nome"
              [class.is-invalid]="form.get('nome')?.invalid && form.get('nome')?.touched"
              placeholder="Digite a rotina"
              rows="3"></textarea>
            @if (form.get('nome')?.invalid && form.get('nome')?.touched) {
            <div class="invalid-feedback d-block">
              Rotina (mínimo 3 caracteres)
            </div>
            }
          </div>

          <!-- <div class="mb-3">
            <label class="form-label">Descrição</label>
            <textarea 
              class="form-control" 
              formControlName="descricao"
              rows="3"
              placeholder="Descreva os detalhes desta rotina (opcional)"></textarea>
          </div> -->
        </form>
        }
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">Cancelar</button>
        <button type="button" class="btn btn-primary" (click)="salvar()" [disabled]="form.invalid || saving">
          @if (saving) {
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
          }
          Criar Rotina
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    :host ::ng-deep .modal-body {
      padding: 1.5rem;
    }
  `]
})
export class NovaRotinaModalComponent {
  private modalService = inject(NgbModal);
  private rotinasEmpresaService = inject(RotinasEmpresaService);
  private fb = inject(FormBuilder);
  
  @ViewChild('modalContent') modalContent!: TemplateRef<any>;
  @Input() empresaId?: string;
  @Input() pilarEmpresa?: PilarEmpresa;
  @Output() rotinaCriada = new EventEmitter<void>();

  private modalRef: any;
  saving = false;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    descricao: ['']
  });

  open(pilarEmpresa: PilarEmpresa): void {
    this.pilarEmpresa = pilarEmpresa;
    this.form.reset();
    
    this.modalRef = this.modalService.open(this.modalContent, { 
      size: 'md',
      backdrop: 'static',
      keyboard: false 
    });
  }

  close(): void {
    this.modalRef?.close();
  }

  salvar(): void {
    if (this.form.invalid || !this.pilarEmpresa || !this.empresaId) return;

    const formValue = this.form.value;
    const dto: CreateRotinaEmpresaDto = {
      nome: formValue.nome! // Rotina customizada (não baseada em template)
    };

    this.saving = true;
    this.rotinasEmpresaService.criarRotinaEmpresa(this.empresaId, this.pilarEmpresa.id, dto).subscribe({
      next: (rotina) => {
        this.showToast(`Rotina "${rotina.nome}" criada com sucesso!`, 'success');
        this.rotinaCriada.emit();
        this.saving = false;
        this.close();
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
