import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { PilarEmpresa } from '@core/services/diagnostico-notas.service';

@Component({
  selector: 'app-criar-cockpit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './criar-cockpit-modal.component.html',
  styleUrl: './criar-cockpit-modal.component.scss',
})
export class CriarCockpitModalComponent {
  @Input() pilar!: PilarEmpresa;

  public activeModal = inject(NgbActiveModal);
  private cockpitService = inject(CockpitPilaresService);

  entradas: string = '';
  saidas: string = '';
  missao: string = '';
  loading = false;
  error: string | null = null;

  criarCockpit(): void {
    if (!this.pilar) return;

    this.loading = true;
    this.error = null;

    this.cockpitService
      .createCockpit(this.pilar.empresaId, this.pilar.id, {
        entradas: this.entradas || undefined,
        saidas: this.saidas || undefined,
        missao: this.missao || undefined,
      })
      .subscribe({
        next: (cockpit) => {
          this.loading = false;
          this.activeModal.close(cockpit);
        },
        error: (err: unknown) => {
          console.error('Erro ao criar cockpit:', err);
          this.error = 'Erro ao criar cockpit. Tente novamente.';
          this.loading = false;
        },
      });
  }

  cancelar(): void {
    this.activeModal.dismiss();
  }
}
