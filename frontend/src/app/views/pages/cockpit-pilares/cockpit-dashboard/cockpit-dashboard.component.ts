import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
export class CockpitDashboardComponent implements OnInit, OnDestroy {
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
  lastSaveTime: Date | null = null;

  // Auto-save Subject
  private autoSaveSubject = new Subject<void>();

  ngOnInit(): void {
    const cockpitId = this.route.snapshot.paramMap.get('id');
    if (cockpitId) {
      this.loadCockpit(cockpitId);
    }

    // Configurar auto-save após 1000ms de inatividade
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.autoSaveSubject.complete();
  }

  private setupAutoSave(): void {
    this.autoSaveSubject
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(() => {
        this.saveContexto();
      });
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

  onContextoChange(): void {
    this.autoSaveSubject.next();
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
          this.lastSaveTime = new Date();
        },
        error: (err: unknown) => {
          console.error('Erro ao salvar contexto:', err);
          this.savingContexto = false;
        },
      });
  }

  voltar(): void {
    this.router.navigate(['/diagnostico-notas']);
  }

  setActiveTab(tab: 'contexto' | 'indicadores' | 'graficos' | 'processos'): void {
    this.activeTab = tab;
  }
}
