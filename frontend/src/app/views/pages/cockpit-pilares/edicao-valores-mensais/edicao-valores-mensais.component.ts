import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { PeriodosMentoriaService } from '@core/services/periodos-mentoria.service';
import { SaveFeedbackService } from '@core/services/save-feedback.service';
import Swal from 'sweetalert2';
import { normalizeDateToSaoPaulo } from '@core/utils/date-time';
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
  private periodosMentoriaService = inject(PeriodosMentoriaService);
  private saveFeedbackService = inject(SaveFeedbackService);
  private autoSaveSubject = new Subject<{
    indicadorMensalId: string;
    campo: 'meta' | 'realizado' | 'historico';
    valor: number | null;
  }>();

  indicadores: IndicadorCockpit[] = [];
  loading = false;
  private savingCount = 0;

  // Controle de novo ciclo
  podeCriarNovoCiclo = false;
  mensagemBotaoCiclo = 'Carregando...';
  criandoNovoCiclo = false;
  private empresaId: string | null = null;

  // Cache de valores em edição
  private valoresCache = new Map<string, { meta?: number; realizado?: number; historico?: number }>();

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
      .pipe(debounceTime(environment.debounceTime), distinctUntilChanged())
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
        this.empresaId = cockpit.pilarEmpresa?.empresa?.id || null;
        this.indicadores = cockpit.indicadores || [];
        this.loading = false;
        
        // Verificar se pode criar novo ciclo
        if (this.empresaId) {
          this.verificarPodeCriarNovoCiclo();
        }
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar indicadores:', err);
        this.loading = false;
      },
    });
  }

  onValorChange(
    indicadorMensal: IndicadorMensal,
    campo: 'meta' | 'realizado' | 'historico',
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
    campo: 'meta' | 'realizado' | 'historico',
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
          historico: cached.historico ?? mes.historico ?? undefined,
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
        const message = (err as any)?.error?.message || 'Erro ao salvar. Tente novamente.';
        alert(message);
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
      error: (err: any) => {
        console.error('Erro ao replicar meta:', err);
        console.error('Detalhes do erro:', err.error);
        console.error('Valores enviados:', valores);
        alert(`Erro ao replicar meta: ${err.error?.message || err.message || 'Erro desconhecido'}`);
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

  calcularDesvioAbsoluto(indicador: IndicadorCockpit, mes: IndicadorMensal): number {
    const meta = this.getValorAtualizado(mes, 'meta');
    const realizado = this.getValorAtualizado(mes, 'realizado');
    
    if (!meta || !realizado) return 0;

    const desvio = indicador.melhor === DirecaoIndicador.MAIOR
      ? realizado - meta
      : meta - realizado;
    
    return parseFloat(desvio.toFixed(2));
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
      return 'danger';
    } else {
      // Para MENOR, quanto menor melhor
      if (percentual <= 100) return 'success';
      return 'danger';
    }
  }

  /**
   * Obtém o valor atualizado (cache ou valor original do objeto)
   */
  private getValorAtualizado(
    mes: IndicadorMensal,
    campo: 'meta' | 'realizado' | 'historico'
  ): number | null {
    const cached = this.valoresCache.get(mes.id);
    if (cached && cached[campo] !== undefined) {
      return cached[campo] ?? null;
    }
    return mes[campo] ?? null;
  }

  getMesesOrdenados(indicador: IndicadorCockpit): IndicadorMensal[] {
    if (!indicador.mesesIndicador) return [];
    
    // Ordenar por ano DESC, mes DESC e retornar apenas últimos 13 meses
    const mesesOrdenados = indicador.mesesIndicador
      .filter((m: IndicadorMensal) => m.mes !== null)
      .sort((a: IndicadorMensal, b: IndicadorMensal) => {
        if (a.ano !== b.ano) {
          return b.ano - a.ano;
        }
        return b.mes! - a.mes!;
      });
    
    // Retornar apenas os últimos 13 meses
    return mesesOrdenados.slice(0, 13).reverse();
  }

  private verificarPodeCriarNovoCiclo(): void {
    if (!this.empresaId) {
      this.podeCriarNovoCiclo = false;
      this.mensagemBotaoCiclo = 'Empresa não identificada';
      return;
    }

    this.periodosMentoriaService.getPeriodoAtivo(this.empresaId).subscribe({
      next: (periodo) => {
        if (!periodo) {
          this.podeCriarNovoCiclo = false;
          this.mensagemBotaoCiclo = 'Empresa não possui período de mentoria ativo';
          return;
        }

        // Verificar se mês atual >= último mês do período
        const agora = normalizeDateToSaoPaulo(new Date());
        const mesAtual = agora.getMonth() + 1;
        const anoAtual = agora.getFullYear();
        const anoMesAtual = anoAtual * 100 + mesAtual;

        const dataFim = normalizeDateToSaoPaulo(periodo.dataFim);
        const mesFim = dataFim.getMonth() + 1;
        const anoFim = dataFim.getFullYear();
        const anoMesFim = anoFim * 100 + mesFim;

        if (anoMesAtual >= anoMesFim) {
          this.podeCriarNovoCiclo = true;
          this.mensagemBotaoCiclo = '';
        } else {
          this.podeCriarNovoCiclo = false;
          this.mensagemBotaoCiclo = `Período de mentoria atual ainda não encerrou (término: ${mesFim.toString().padStart(2, '0')}/${anoFim})`;
        }
      },
      error: (err) => {
        console.error('Erro ao verificar período de mentoria:', err);
        this.podeCriarNovoCiclo = false;
        this.mensagemBotaoCiclo = 'Erro ao verificar período de mentoria';
      },
    });
  }

  criarNovoCicloMeses(): void {
    if (!this.podeCriarNovoCiclo || this.criandoNovoCiclo) return;

    Swal.fire({
      title: 'Criar novo ciclo de 12 meses?',
      text: 'Serão criados 12 novos meses para todos os indicadores do cockpit, a partir do último mês registrado.',
      showCancelButton: true,
      confirmButtonText: 'Sim, criar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.criandoNovoCiclo = true;
        
        this.cockpitService.criarNovoCicloMeses(this.cockpitId).subscribe({
          next: (response) => {
            this.criandoNovoCiclo = false;
            Swal.fire({
              title: 'Ciclo criado!',
              text: `${response.mesesCriados} meses criados para ${response.indicadores} indicadores.`,
              timer: 3000,
            });
            this.loadIndicadores(); // Recarregar para exibir novos meses
          },
          error: (err) => {
            this.criandoNovoCiclo = false;
            Swal.fire({
              title: 'Erro ao criar ciclo',
              text: err?.error?.message || 'Erro desconhecido',
            });
          },
        });
      }
    });
  }

  getNomeMes(mes: number, ano?: number): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const nomeMes = meses[mes - 1] || '';
    if (ano) {
      const anoAbreviado = ano.toString().slice(-2);
      return `${nomeMes}/${anoAbreviado}`;
    }
    return nomeMes.toUpperCase();
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

  calcularTotalHistorico(indicador: IndicadorCockpit): number {
    if (!indicador.mesesIndicador) return 0;
    return indicador.mesesIndicador.reduce((total, mes) => {
      const valor = this.getValorAtualizado(mes, 'historico');
      return total + (valor || 0);
    }, 0);
  }

  calcularTotalMeta(indicador: IndicadorCockpit): number {
    if (!indicador.mesesIndicador) return 0;
    return indicador.mesesIndicador.reduce((total, mes) => {
      const valor = this.getValorAtualizado(mes, 'meta');
      return total + (valor || 0);
    }, 0);
  }

  calcularTotalRealizado(indicador: IndicadorCockpit): number {
    if (!indicador.mesesIndicador) return 0;
    return indicador.mesesIndicador.reduce((total, mes) => {
      const valor = this.getValorAtualizado(mes, 'realizado');
      return total + (valor || 0);
    }, 0);
  }

  calcularMediaHistorico(indicador: IndicadorCockpit): number {
    if (!indicador.mesesIndicador || indicador.mesesIndicador.length === 0) return 0;
    const total = this.calcularTotalHistorico(indicador);
    return total / indicador.mesesIndicador.length;
  }

  calcularMediaMeta(indicador: IndicadorCockpit): number {
    if (!indicador.mesesIndicador || indicador.mesesIndicador.length === 0) return 0;
    const total = this.calcularTotalMeta(indicador);
    return total / indicador.mesesIndicador.length;
  }

  calcularMediaRealizado(indicador: IndicadorCockpit): number {
    if (!indicador.mesesIndicador || indicador.mesesIndicador.length === 0) return 0;
    const total = this.calcularTotalRealizado(indicador);
    return total / indicador.mesesIndicador.length;
  }
}
