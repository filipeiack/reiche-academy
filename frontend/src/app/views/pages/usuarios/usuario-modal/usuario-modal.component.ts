import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { UsuariosFormComponent } from '../usuarios-form/usuarios-form.component';
import { Usuario } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-usuario-modal',
  standalone: true,
  imports: [CommonModule, NgbModalModule, UsuariosFormComponent],
  template: `
    <ng-template #modalContent let-modal>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="feather icon-user-plus me-2"></i>
          Criar Novo Usuário
        </h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        <app-usuarios-form 
          [modalMode]="true"
          [presetEmpresaId]="empresaId"
          (onSave)="handleSave($event)"
          (onCancel)="modal.dismiss()">
        </app-usuarios-form>
      </div>
    </ng-template>
  `,
  styles: [`
    :host ::ng-deep .modal-body {
      padding: 1.5rem;
    }
  `]
})
export class UsuarioModalComponent {
  private modalService = inject(NgbModal);
  
  @ViewChild('modalContent') modalContent!: TemplateRef<any>;
  @Input() empresaId?: string;
  @Output() usuarioCriado = new EventEmitter<Usuario>();

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

  handleSave(usuario: Usuario): void {
    this.usuarioCriado.emit(usuario);
    this.close();
  }
}
