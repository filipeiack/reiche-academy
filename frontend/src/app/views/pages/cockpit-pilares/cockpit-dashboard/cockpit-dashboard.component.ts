import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { SaveFeedbackService, SaveFeedback } from '@core/services/save-feedback.service';
import { EmpresaContextService } from '@core/services/empresa-context.service';
import { CockpitPilar } from '@core/interfaces/cockpit-pilares.interface';
import { MatrizIndicadoresComponent } from '../matriz-indicadores/matriz-indicadores.component';
import { GraficoIndicadoresComponent } from '../grafico-indicadores/grafico-indicadores.component';
import { MatrizProcessosComponent } from '../matriz-processos/matriz-processos.component';
import { MatrizCargosFuncoesComponent } from '../matriz-cargos-funcoes/matriz-cargos-funcoes.component';
import { PlanoAcaoEspecificoComponent } from '../plano-acao-especifico/plano-acao-especifico.component';

@Component({
  selector: 'app-cockpit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatrizIndicadoresComponent,
    GraficoIndicadoresComponent,
    MatrizProcessosComponent,
    MatrizCargosFuncoesComponent,
    PlanoAcaoEspecificoComponent,
  ],
  templateUrl: './cockpit-dashboard.component.html',
  styleUrl: './cockpit-dashboard.component.scss',
})
export class CockpitDashboardComponent implements OnInit, OnDestroy {
  private cockpitService = inject(CockpitPilaresService);
  private saveFeedbackService = inject(SaveFeedbackService);
  private empresaContextService = inject(EmpresaContextService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  cockpit: CockpitPilar | null = null;
  loading = false;
  error: string | null = null;
  activeTab:
    | 'contexto'
    | 'indicadores'
    | 'graficos'
    | 'processos'
    | 'cargos-funcoes'
    | 'plano-acao' = 'indicadores';
  
  // Contexto editável
  entradas: string = '';
  saidas: string = '';
  missao: string = '';
  
  // Feedback centralizado
  saveFeedback: SaveFeedback = {
    context: '',
    saving: false,
    lastSaveTime: null,
  };

  // Auto-save Subject
  private autoSaveSubject = new Subject<void>();
  private routeParamsSubscription?: Subscription;
  private feedbackSubscription?: Subscription;
  private currentCockpitId: string | null = null;

  ngOnInit(): void {
    // Subscrever aos parâmetros da rota para detectar mudanças
    this.routeParamsSubscription = this.route.paramMap.subscribe(params => {
      const cockpitId = params.get('id');
      if (cockpitId) {
        this.currentCockpitId = cockpitId;
        this.loadCockpit(cockpitId);
        this.restoreActiveTab();
      }
    });

    // Subscrever ao feedback centralizado
    this.feedbackSubscription = this.saveFeedbackService.feedback$.subscribe(
      feedback => this.saveFeedback = feedback
    );

    // Configurar auto-save após 1000ms de inatividade
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.autoSaveSubject.complete();
    this.routeParamsSubscription?.unsubscribe();
    this.feedbackSubscription?.unsubscribe();
    this.saveFeedbackService.reset();
  }

  private setupAutoSave(): void {
    this.autoSaveSubject
      .pipe(debounceTime(environment.debounceTime), distinctUntilChanged())
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
        
        // Sincronizar empresa selecionada na navbar com a empresa do cockpit
        if (cockpit.pilarEmpresa?.empresaId) {
          this.empresaContextService.syncEmpresaFromResource(cockpit.pilarEmpresa.empresaId);
        }
        
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar cockpit:', err);
        this.error = 'Erro ao carregar cockpit. Tente novamente.';
        this.loading = false;
      },
    });
  }

  private getSessionStorageKey(): string {
    return `cockpit_tabs_${this.currentCockpitId}`;
  }

  private saveActiveTab(): void {
    if (!this.currentCockpitId) return;
    try {
      sessionStorage.setItem(this.getSessionStorageKey(), this.activeTab);
    } catch (error) {
      console.warn('Erro ao salvar aba ativa do cockpit:', error);
    }
  }

  private restoreActiveTab(): void {
    if (!this.currentCockpitId) return;
    try {
      const savedTab = sessionStorage.getItem(this.getSessionStorageKey());
      if (
        savedTab &&
        [
          'contexto',
          'indicadores',
          'graficos',
          'processos',
          'cargos-funcoes',
          'plano-acao',
        ].includes(savedTab)
      ) {
        this.activeTab = savedTab as typeof this.activeTab;
      }
    } catch (error) {
      console.warn('Erro ao restaurar aba ativa do cockpit:', error);
    }
  }

  onContextoChange(): void {
    this.autoSaveSubject.next();
  }

  saveContexto(): void {
    if (!this.cockpit) return;

    this.saveFeedbackService.startSaving('Contexto do pilar');

    this.cockpitService
      .updateCockpit(this.cockpit.id, {
        entradas: this.entradas,
        saidas: this.saidas,
        missao: this.missao,
      })
      .subscribe({
        next: (updated: CockpitPilar) => {
          this.cockpit = updated;
          this.saveFeedbackService.completeSaving();
        },
        error: (err: unknown) => {
          console.error('Erro ao salvar contexto:', err);
          this.saveFeedbackService.reset();
        },
      });
  }

  voltar(): void {
    this.router.navigate(['/diagnostico-notas']);
  }

  setActiveTab(
    tab:
      | 'contexto'
      | 'indicadores'
      | 'graficos'
      | 'processos'
      | 'cargos-funcoes'
      | 'plano-acao'
  ): void {
    this.activeTab = tab;
    this.saveActiveTab();
  }
}
