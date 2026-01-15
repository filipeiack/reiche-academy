import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { CockpitPilar } from '@core/interfaces/cockpit-pilares.interface';
import { MatrizIndicadoresComponent } from '../matriz-indicadores/matriz-indicadores.component';
import { GraficoIndicadoresComponent } from '../grafico-indicadores/grafico-indicadores.component';
import { MatrizProcessosComponent } from '../matriz-processos/matriz-processos.component';

@Component({
  selector: 'app-cockpit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatrizIndicadoresComponent,
    GraficoIndicadoresComponent,
    MatrizProcessosComponent,
  ],
  templateUrl: './cockpit-dashboard.component.html',
  styleUrl: './cockpit-dashboard.component.scss',
})
export class CockpitDashboardComponent implements OnInit {
  private cockpitService = inject(CockpitPilaresService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  cockpit: CockpitPilar | null = null;
  loading = false;
  error: string | null = null;
  activeTab: 'contexto' | 'indicadores' | 'graficos' | 'processos' = 'indicadores';
  
  // Contexto editável
  entradas: string = '';
  saidas: string = '';
  missao: string = '';
  savingContexto = false;

  ngOnInit(): void {
    const cockpitId = this.route.snapshot.paramMap.get('id');
    if (cockpitId) {
      this.loadCockpit(cockpitId);
    }
  }

  private loadCockpit(cockpitId: string): void {
    this.loading = true;
    this.error = null;

    this.cockpitService.getCockpitById(cockpitId).subscribe({
      next: (cockpit: CockpitPilar) => {
        this.cockpit = cockpit;
        this.entradas = cockpit.entradas || '';
        this.saidas = cockpit.saidas || '';
        this.missao = cockpit.missao || '';
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar cockpit:', err);
        this.error = 'Erro ao carregar cockpit. Tente novamente.';
        this.loading = false;
      },
    });
  }

  saveContexto(): void {
    if (!this.cockpit) return;

    this.savingContexto = true;

    this.cockpitService
      .updateCockpit(this.cockpit.id, {
        entradas: this.entradas,
        saidas: this.saidas,
        missao: this.missao,
      })
      .subscribe({
        next: (updated: CockpitPilar) => {
          this.cockpit = updated;
          this.savingContexto = false;
        },
        error: (err: unknown) => {
          console.error('Erro ao salvar contexto:', err);
          alert('Erro ao salvar contexto. Tente novamente.');
          this.savingContexto = false;
        },
      });
  }

  voltar(): void {
    this.router.navigate(['/diagnostico']);
  }

  setActiveTab(tab: 'contexto' | 'indicadores' | 'graficos' | 'processos'): void {
    this.activeTab = tab;
  }
}
