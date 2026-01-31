import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-descricao-indicador-modal',
  standalone: true,
  imports: [CommonModule, NgbModalModule, FormsModule],
  template: `
    <ng-template #modalContent let-modal>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="bi bi-file-text me-2"></i>
          Descrição do Indicador
        </h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        @if (indicadorNome) {
        <div class="mb-3">
          <p class="text-muted">
            <strong>Indicador:</strong> {{ indicadorNome }}
          </p>
        </div>
        }

        <div class="mb-3">
          <label for="descricaoTextarea" class="form-label">Descrição</label>
          <textarea 
            id="descricaoTextarea"
            class="form-control" 
            [(ngModel)]="descricao"
            rows="5"
            placeholder="Digite a descrição do indicador..."></textarea>
          <small class="text-muted">
            Use este campo para detalhar como o indicador é medido, sua importância e observações relevantes.
          </small>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">Cancelar</button>
        <button type="button" class="btn btn-primary" (click)="salvar()">
          Salvar
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    :host ::ng-deep .modal-body {
      padding: 1.5rem;
    }
    
    :host ::ng-deep textarea {
      resize: vertical;
      min-height: 120px;
    }
  `]
})
export class DescricaoIndicadorModalComponent {
  private modalService = inject(NgbModal);
  
  @ViewChild('modalContent') modalContent!: TemplateRef<any>;
  @Input() indicadorNome?: string;
  @Output() descricaoSalva = new EventEmitter<string>();

  private modalRef: NgbModalRef | null = null;
  descricao: string = '';

  open(descricaoAtual: string = '', nomeIndicador: string = ''): void {
    this.descricao = descricaoAtual;
    this.indicadorNome = nomeIndicador;
    
    this.modalRef = this.modalService.open(this.modalContent, { 
      size: 'lg',
      backdrop: 'static',
      keyboard: true 
    });
  }

  close(): void {
    this.modalRef?.close();
    // Reset state to prevent stale data
    this.descricao = '';
    this.indicadorNome = '';
  }

  salvar(): void {
    this.descricaoSalva.emit(this.descricao.trim());
    this.close();
  }
}
