import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { PilaresEmpresaFormComponent } from '../pilares-empresa-form/pilares-empresa-form.component';

@Component({
  selector: 'app-pilares-empresa-modal',
  standalone: true,
  imports: [CommonModule, NgbModalModule, PilaresEmpresaFormComponent],
  template: `
    <ng-template #modalContent let-modal>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="feather icon-layers me-2"></i>
          Gerenciar Pilares da Empresa
        </h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        <app-pilares-empresa-form
          [empresaId]="empresaId"
          [isPerfilCliente]="isPerfilCliente"
          (pilaresChanged)="handlePilaresChanged()">
        </app-pilares-empresa-form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="modal.close()">Fechar</button>
        @if (this.formComponent.temAlteracoes) {
        <button type="button" class="btn btn-success" (click)="salvarEFechar()">
          <i class="feather icon-save me-1"></i>
          Salvar Ordem
        </button>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    
  `]
})
export class PilaresEmpresaModalComponent {
  private modalService = inject(NgbModal);
  
  @ViewChild('modalContent') modalContent!: TemplateRef<any>;
  @ViewChild(PilaresEmpresaFormComponent) formComponent!: PilaresEmpresaFormComponent;
  @Input() empresaId!: string;
  @Input() isPerfilCliente: boolean = false;
  @Output() pilaresModificados = new EventEmitter<void>();

  private modalRef: any;

  open(): void {
    this.modalRef = this.modalService.open(this.modalContent, { 
      size: 'lg',
      backdrop: 'static',
      keyboard: false 
    });
  }

  close(): void {
    this.modalRef?.close();
  }

  handlePilaresChanged(): void {
    this.pilaresModificados.emit();
  }

  salvarEFechar(): void {
    this.formComponent.salvarOrdem();
    this.modalRef?.close();
  }
}
