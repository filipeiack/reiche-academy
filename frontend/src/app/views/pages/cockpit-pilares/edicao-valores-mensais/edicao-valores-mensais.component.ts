import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { SaveFeedbackService } from '@core/services/save-feedback.service';
import {
  CockpitPilar,
  IndicadorCockpit,
  IndicadorMensal,
  DirecaoIndicador,
  StatusMedicaoIndicador,
} from '@core/interfaces/cockpit-pilares.interface';

@Component({
  selector: 'app-edicao-valores-mensais',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edicao-valores-mensais.component.html',
  styleUrl: './edicao-valores-mensais.component.scss',
})
export class EdicaoValoresMensaisComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cockpitId!: string;

  private cockpitService = inject(CockpitPilaresService);
  private saveFeedbackService = inject(SaveFeedbackService);
  private autoSaveSubject = new Subject<{
    indicadorMensalId: string;
    campo: 'meta' | 'realizado';
    valor: number | null;
  }>();

  indicadores: IndicadorCockpit[] = [];
  loading = false;
  private savingCount = 0;

  // Cache de valores em edição
  private valoresCache = new Map<string, { meta?: number; realizado?: number }>();

  ngOnInit(): void {
    this.setupAutoSave();
    this.loadIndicadores();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recarregar quando cockpitId mudar
    if (changes['cockpitId'] && !changes['cockpitId'].firstChange) {
      this.loadIndicadores();
    }
  }

  ngOnDestroy(): void {
    this.autoSaveSubject.complete();
  }

  private setupAutoSave(): void {
    this.autoSaveSubject
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((change) => {
        this.executeSave(change.indicadorMensalId, change.campo, change.valor);
      });
  }

  /**
   * Método público para reload forçado (chamado pelo container)
   */
  public reload(): void {
    this.loadIndicadores();
  }

  private loadIndicadores(): void {
    this.loading = true;

    this.cockpitService.getCockpitById(this.cockpitId).subscribe({
      next: (cockpit: CockpitPilar) => {
        this.indicadores = cockpit.indicadores || [];
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar indicadores:', err);
        this.loading = false;
      },
    });
  }

  onValorChange(
    indicadorMensal: IndicadorMensal,
    campo: 'meta' | 'realizado',
    event: Event
  ): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value ? parseFloat(input.value) : null;

    // Atualizar valor localmente para recálculo imediato
    indicadorMensal[campo] = valor ?? undefined;

    // Se for meta, replicar para meses seguintes
    if (campo === 'meta' && valor !== null) {
      this.replicarMetaParaMesesSeguintes(indicadorMensal, valor);
    }

    // Atualizar cache local
    const cacheKey = indicadorMensal.id;
    if (!this.valoresCache.has(cacheKey)) {
      this.valoresCache.set(cacheKey, {});
    }
    const cached = this.valoresCache.get(cacheKey)!;
    cached[campo] = valor ?? undefined;

    // Agendar auto-save
    this.autoSaveSubject.next({
      indicadorMensalId: indicadorMensal.id,
      campo,
      valor,
    });
  }

  private executeSave(
    indicadorMensalId: string,
    campo: 'meta' | 'realizado',
    valor: number | null
  ): void {
    this.savingCount++;
    if (this.savingCount === 1) {
      this.saveFeedbackService.startSaving('Valores mensais');
    }

    // Encontrar o indicador e mes
    let indicadorId: string | null = null;
    let mes: IndicadorMensal | null = null;

    for (const ind of this.indicadores) {
      const found = ind.mesesIndicador?.find((m: IndicadorMensal) => m.id === indicadorMensalId);
      if (found) {
        indicadorId = ind.id;
        mes = found;
        break;
      }
    }

    if (!indicadorId || !mes) {
      console.error('Mês não encontrado:', indicadorMensalId);
      this.savingCount--;
      if (this.savingCount === 0) {
        this.saveFeedbackService.reset();
      }
      return;
    }

    // Preparar payload com cache
    const cached = this.valoresCache.get(indicadorMensalId) || {};
    const payload = {
      valores: [
        {
          mes: mes.mes,
          ano: mes.ano,
          meta: cached.meta ?? mes.meta ?? undefined,
          realizado: cached.realizado ?? mes.realizado ?? undefined,
        },
      ],
    };

    this.cockpitService.updateValoresMensais(indicadorId, payload).subscribe({
      next: () => {
        this.savingCount--;
        if (this.savingCount === 0) {
          this.saveFeedbackService.completeSaving();
        }
        this.valoresCache.delete(indicadorMensalId);
      },
      error: (err: unknown) => {
        console.error('Erro ao salvar valor mensal:', err);
        alert('Erro ao salvar. Tente novamente.');
        this.savingCount--;
        if (this.savingCount === 0) {
          this.saveFeedbackService.reset();
        }
      },
    });
  }

  /**
   * Replica a meta para todos os meses seguintes
   */
  private replicarMetaParaMesesSeguintes(
    mesAtual: IndicadorMensal,
    valorMeta: number
  ): void {
    // Encontrar o indicador que contém este mês
    const indicador = this.indicadores.find(ind => 
      ind.mesesIndicador?.some(m => m.id === mesAtual.id)
    );

    if (!indicador || !indicador.mesesIndicador) return;

    // Coletar todos os meses seguintes
    const mesesSeguintes = indicador.mesesIndicador
      .filter(m => m.mes !== null && m.mes! > mesAtual.mes!);

    if (mesesSeguintes.length === 0) return;

    // Atualizar valores localmente
    mesesSeguintes.forEach(m => {
      m.meta = valorMeta;
    });

    // Preparar payload com todos os meses
    const valores = mesesSeguintes.map(m => ({
      mes: m.mes!,
      ano: m.ano!,
      meta: valorMeta,
      realizado: m.realizado ?? undefined,
    }));

    // Salvar todos de uma vez
    this.savingCount++;
    if (this.savingCount === 1) {
      this.saveFeedbackService.startSaving('Valores mensais');
    }

    this.cockpitService.updateValoresMensais(indicador.id, { valores }).subscribe({
      next: () => {
        this.savingCount--;
        if (this.savingCount === 0) {
          this.saveFeedbackService.completeSaving();
        }
      },
      error: (err: unknown) => {
        console.error('Erro ao replicar meta:', err);
        alert('Erro ao replicar meta. Tente novamente.');
        this.savingCount--;
        if (this.savingCount === 0) {
          this.saveFeedbackService.reset();
        }
      },
    });
  }

  calcularDesvio(indicador: IndicadorCockpit, mes: IndicadorMensal): number {
    const meta = this.getValorAtualizado(mes, 'meta');
    const realizado = this.getValorAtualizado(mes, 'realizado');
    
    if (!meta || !realizado) return 0;

    if (indicador.melhor === DirecaoIndicador.MAIOR) {
      return ((realizado - meta) / meta) * 100;
    } else {
      return ((meta - realizado) / meta) * 100;
    }
  }

  calcularStatus(
    indicador: IndicadorCockpit,
    mes: IndicadorMensal
  ): 'success' | 'warning' | 'danger' | null {
    const meta = this.getValorAtualizado(mes, 'meta');
    const realizado = this.getValorAtualizado(mes, 'realizado');
    
    if (!meta || !realizado) return null;

    const percentual = (realizado / meta) * 100;

    if (indicador.melhor === DirecaoIndicador.MAIOR) {
      if (percentual >= 100) return 'success';
      if (percentual >= 80) return 'warning';
      return 'danger';
    } else {
      // Para MENOR, quanto menor melhor
      if (percentual <= 100) return 'success';
      if (percentual <= 120) return 'warning';
      return 'danger';
    }
  }

  /**
   * Obtém o valor atualizado (cache ou valor original do objeto)
   */
  private getValorAtualizado(
    mes: IndicadorMensal,
    campo: 'meta' | 'realizado'
  ): number | null {
    const cached = this.valoresCache.get(mes.id);
    if (cached && cached[campo] !== undefined) {
      return cached[campo] ?? null;
    }
    return mes[campo] ?? null;
  }

  getMesesOrdenados(indicador: IndicadorCockpit): IndicadorMensal[] {
    if (!indicador.mesesIndicador) return [];
    return indicador.mesesIndicador
      .filter((m: IndicadorMensal) => m.mes !== null)
      .sort((a: IndicadorMensal, b: IndicadorMensal) => (a.mes! - b.mes!));
  }

  getNomeMes(mes: number): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses[mes - 1].toUpperCase() || '';
  }

  getLabelTipoMedida(tipo: string): string {
    const labels: Record<string, string> = {
      'REAL': 'R$',
      'QUANTIDADE': 'Qtde',
      'TEMPO': 'Tempo',
      'PERCENTUAL': '%'
    };
    return labels[tipo] || tipo;
  }
}
