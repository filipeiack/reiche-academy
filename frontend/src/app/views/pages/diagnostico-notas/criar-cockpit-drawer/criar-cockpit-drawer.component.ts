import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { MenuService } from '@core/services/menu.service';
import { PilarEmpresa } from '@core/services/diagnostico-notas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-criar-cockpit-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title">
          <i class="feather icon-target me-2"></i>
          Criar Cockpit {{ pilar.nome || 'Pilar' }}
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto">
        @if (error) {
          <div class="alert alert-danger" role="alert">
            <i class="feather icon-alert-triangle me-2"></i>
            {{ error }}
          </div>
        }

        <div class="mb-3">
          <label class="form-label">ENTRADAS (opcional):</label>
          <textarea
            class="form-control"
            [(ngModel)]="entradas"
            rows="3"
            maxlength="300"
            placeholder="Ex: Pedidos de clientes, solicitações de propostas comerciais, leads qualificados do marketing"
            data-testid="entradas-textarea"
          ></textarea>
          <small class="form-text text-muted">{{ entradas.length }}/300</small>
        </div>

        <div class="mb-3">
          <label class="form-label">SAÍDAS (opcional):</label>
          <textarea
            class="form-control"
            [(ngModel)]="saidas"
            rows="3"
            maxlength="300"
            placeholder="Ex: Propostas enviadas, contratos fechados"
            data-testid="saidas-textarea"
          ></textarea>
          <small class="form-text text-muted">{{ saidas.length }}/300</small>
        </div>

        <div class="mb-3">
          <label class="form-label">MISSÃO DO PILAR (opcional):</label>
          <textarea
            class="form-control"
            [(ngModel)]="missao"
            rows="3"
            maxlength="300"
            placeholder="Ex: Maximizar faturamento via canal indireto"
            data-testid="missao-textarea"
          ></textarea>
          <small class="form-text text-muted">{{ missao.length }}/300</small>
        </div>

        <div class="alert alert-info">
          <i class="feather icon-info me-2"></i>
          <small>
            Após criar o cockpit, você será redirecionado automaticamente para a gestão do mesmo.
          </small>
        </div>
      </div>

      <div class="offcanvas-footer border-top p-3 flex-shrink-0 bg-light">
        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-secondary" (click)="fechar()" [disabled]="loading">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="criarCockpit()"
            [disabled]="loading"
            data-testid="btn-criar-cockpit"
          >
            @if (loading) {
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              Criando...
            } @else {
              <i class="feather icon-check me-2"></i>
              Criar e Ir para o Cockpit
            }
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
      background-color: #f8f9fa;
    }
  `]
})
export class CriarCockpitDrawerComponent {
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private cockpitService = inject(CockpitPilaresService);
  private menuService = inject(MenuService);
  private router = inject(Router);

  @Input() pilar!: PilarEmpresa;
  @Output() cockpitCriado = new EventEmitter<void>();

  entradas: string = '';
  saidas: string = '';
  missao: string = '';
  loading = false;
  error: string | null = null;

  fechar(): void {
    this.activeOffcanvas.dismiss();
  }

  criarCockpit(): void {
    if (!this.pilar) return;

    this.loading = true;
    this.error = null;

    this.cockpitService
      .createCockpit(this.pilar.empresaId, this.pilar.id, {
        pilarEmpresaId: this.pilar.id,
        entradas: this.entradas || undefined,
        saidas: this.saidas || undefined,
        missao: this.missao || undefined,
      })
      .subscribe({
        next: (cockpit) => {
          this.loading = false;
          this.showToast('Cockpit criado com sucesso!', 'success');
          
          // Atualizar menu da sidebar
          this.menuService.refreshMenu();
          
          // Emitir evento
          this.cockpitCriado.emit();
          
          // Fechar drawer
          this.activeOffcanvas.close(cockpit);
          
          // Redirecionar para dashboard do cockpit
          this.router.navigate(['/cockpits', cockpit.id, 'dashboard']);
        },
        error: (err: unknown) => {
          console.error('Erro ao criar cockpit:', err);
          this.error = 'Erro ao criar cockpit. Tente novamente.';
          this.showToast('Erro ao criar cockpit', 'error');
          this.loading = false;
        },
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
