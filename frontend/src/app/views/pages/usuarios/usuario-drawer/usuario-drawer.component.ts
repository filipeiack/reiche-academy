import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { UsuariosFormComponent } from '../usuarios-form/usuarios-form.component';
import { Usuario } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-usuario-drawer',
  standalone: true,
  imports: [CommonModule, UsuariosFormComponent],
  template: `
    <div class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title">
          <i class="feather icon-user-plus me-2"></i>
          Criar Novo Usuário
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto">
        <app-usuarios-form
          [modalMode]="true"
          [presetEmpresaId]="empresaId"
          (onSave)="handleSave($event)"
          (onCancel)="fechar()">
        </app-usuarios-form>
      </div>

      <div class="offcanvas-footer border-top p-3 flex-shrink-0 bg-light">
        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-secondary" (click)="fechar()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" form="usuarioForm">
            Salvar
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
export class UsuarioDrawerComponent {
  private activeOffcanvas = inject(NgbActiveOffcanvas);

  @Input() empresaId?: string;
  @Output() usuarioCriado = new EventEmitter<Usuario>();

  fechar(): void {
    this.activeOffcanvas.dismiss();
  }

  handleSave(usuario: Usuario): void {
    this.usuarioCriado.emit(usuario);
    this.activeOffcanvas.close();
  }
}
