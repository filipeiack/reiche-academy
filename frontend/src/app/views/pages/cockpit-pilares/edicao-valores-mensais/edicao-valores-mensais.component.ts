import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbDateParserFormatter, NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '@environments/environment';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { SaveFeedbackService } from '@core/services/save-feedback.service';
import Swal from 'sweetalert2';
import {
  formatDateInputSaoPaulo,
  formatIsoSaoPaulo,
  formatMonthYearSaoPaulo,
  normalizeDateToSaoPaulo,
  parseDateInputSaoPaulo,
} from '@core/utils/date-time';
import {
  CockpitPilar,
  IndicadorCockpit,
  IndicadorMensal,
  DirecaoIndicador,
  StatusMedicaoIndicador,
} from '@core/interfaces/cockpit-pilares.interface';

class MonthYearParserFormatter extends NgbDateParserFormatter {
  parse(value: string): NgbDateStruct | null {
    if (!value) return null;
    const parts = value.split('/');
    if (parts.length !== 2) return null;

    const month = Number(parts[0]);
    const year = Number(parts[1]);

    if (!month || !year || month < 1 || month > 12) return null;

    return { year, month, day: 1 };
  }

  format(date: NgbDateStruct | null): string {
    if (!date) return '';
    const month = String(date.month).padStart(2, '0');
    return `${month}/${date.year}`;
  }
}

@Component({
  selector: 'app-edicao-valores-mensais',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatepickerModule],
  templateUrl: './edicao-valores-mensais.component.html',
  styleUrl: './edicao-valores-mensais.component.scss',
  providers: [{ provide: NgbDateParserFormatter, useClass: MonthYearParserFormatter }],
})
export class EdicaoValoresMensaisComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cockpitId!: string;

  private cockpitService = inject(CockpitPilaresService);
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
  dataReferenciaInput: string | null = null;
  dataReferenciaDefinida: Date | null = null;
  dataReferenciaPicker: NgbDateStruct | null = null;
  hasMeses = false;

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
        this.indicadores = cockpit.indicadores || [];
        this.hasMeses = this.indicadores.some(
          (indicador) => (indicador.mesesIndicador?.length ?? 0) > 0
        );

        if (cockpit.dataReferencia) {
          const referencia = normalizeDateToSaoPaulo(new Date(cockpit.dataReferencia));
          this.dataReferenciaDefinida = referencia;
          this.dataReferenciaInput = formatDateInputSaoPaulo(referencia).slice(0, 7);
          this.dataReferenciaPicker = {
            year: referencia.getFullYear(),
            month: referencia.getMonth() + 1,
            day: 1,
          };
        } else {
          this.dataReferenciaDefinida = null;
          this.dataReferenciaInput = null;
          this.dataReferenciaPicker = null;
        }
        this.loading = false;

        this.verificarPodeCriarNovoCiclo();
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
    
    if (meta === null || meta === undefined || realizado === null || realizado === undefined) return 0;

    if (meta === 0) {
      if (realizado === 0) return 0;
      return indicador.melhor === DirecaoIndicador.MAIOR
        ? (realizado - meta) * 100
        : (meta - realizado) * 100;
    }

    if (indicador.melhor === DirecaoIndicador.MAIOR) {
      return ((realizado - meta) / meta) * 100;
    } else {
      return ((meta - realizado) / meta) * 100;
    }
  }

  calcularDesvioAbsoluto(indicador: IndicadorCockpit, mes: IndicadorMensal): number {
    const meta = this.getValorAtualizado(mes, 'meta');
    const realizado = this.getValorAtualizado(mes, 'realizado');
    
    if (meta === null || meta === undefined || realizado === null || realizado === undefined) return 0;

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
    
    if (meta === null || meta === undefined || realizado === null || realizado === undefined) return null;

    if (meta === 0) {
      if (realizado === 0) return 'success';
      if (indicador.melhor === DirecaoIndicador.MAIOR) {
        return realizado > 0 ? 'success' : 'danger';
      }
      return realizado < 0 ? 'success' : 'danger';
    }

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

  onDataReferenciaChange(): void {
    if (this.dataReferenciaPicker) {
      const month = String(this.dataReferenciaPicker.month).padStart(2, '0');
      this.dataReferenciaInput = `${this.dataReferenciaPicker.year}-${month}`;
    } else {
      this.dataReferenciaInput = null;
    }
    this.verificarPodeCriarNovoCiclo();
  }

  private verificarPodeCriarNovoCiclo(): void {
    if (this.dataReferenciaDefinida) {
      this.podeCriarNovoCiclo = false;
      this.mensagemBotaoCiclo = `Referência definida em ${formatMonthYearSaoPaulo(
        this.dataReferenciaDefinida
      )}`;
      return;
    }

    if (!this.dataReferenciaInput) {
      this.podeCriarNovoCiclo = false;
      this.mensagemBotaoCiclo = 'Selecione um mês/ano de referência';
      return;
    }

    this.podeCriarNovoCiclo = true;
    this.mensagemBotaoCiclo = '';
  }

  criarNovoCicloMeses(): void {
    if (!this.podeCriarNovoCiclo || this.criandoNovoCiclo) return;
    if (!this.dataReferenciaInput) return;

    const dataReferencia = parseDateInputSaoPaulo(
      `${this.dataReferenciaInput}-01`
    );
    const dataNormalizada = normalizeDateToSaoPaulo(dataReferencia);
    const dataReferenciaIso = formatIsoSaoPaulo(dataNormalizada);

    Swal.fire({
      title: 'Criar novo ciclo de 12 meses?',
      text: 'Serão criados 12 meses para todos os indicadores do cockpit a partir da referência informada.',
      showCancelButton: true,
      confirmButtonText: 'Sim, criar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.criandoNovoCiclo = true;
        
        this.cockpitService
          .criarNovoCicloMeses(this.cockpitId, dataReferenciaIso)
          .subscribe({
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
