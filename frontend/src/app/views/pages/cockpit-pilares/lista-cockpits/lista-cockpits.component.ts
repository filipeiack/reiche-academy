import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { EmpresaContextService } from '@core/services/empresa-context.service';
import { CockpitPilar } from '@core/interfaces/cockpit-pilares.interface';

@Component({
  selector: 'app-lista-cockpits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-cockpits.component.html',
  styleUrl: './lista-cockpits.component.scss',
})
export class ListaCockpitsComponent implements OnInit {
  private cockpitService = inject(CockpitPilaresService);
  private empresaContext = inject(EmpresaContextService);
  private router = inject(Router);

  cockpits: CockpitPilar[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadCockpits();
  }

  private loadCockpits(): void {
    const empresaId = this.empresaContext.getEmpresaId();
    if (!empresaId) {
      this.error = 'Empresa não identificada';
      return;
    }

    this.loading = true;
    this.error = null;

    this.cockpitService.getCockpitsByEmpresa(empresaId).subscribe({
      next: (cockpits) => {
        this.cockpits = cockpits;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar cockpits:', err);
        this.error = 'Erro ao carregar cockpits. Tente novamente.';
        this.loading = false;
      },
    });
  }

  abrirDashboard(cockpit: CockpitPilar): void {
    this.router.navigate(['/cockpits', cockpit.id, 'dashboard']);
  }

  voltarParaDiagnostico(): void {
    this.router.navigate(['/diagnostico-notas']);
  }
}
