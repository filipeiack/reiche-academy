import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import {
  DadosGraficos,
  IndicadorCockpit,
  DirecaoIndicador,
} from '@core/interfaces/cockpit-pilares.interface';
import { formatMonthYearSaoPaulo, normalizeDateToSaoPaulo, parseDateInputSaoPaulo } from '@core/utils/date-time';

// Registrar componentes do Chart.js
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

@Component({
  selector: 'app-grafico-indicadores',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, BaseChartDirective],
  templateUrl: './grafico-indicadores.component.html',
  styleUrl: './grafico-indicadores.component.scss',
})
export class GraficoIndicadoresComponent implements OnInit, OnChanges {
  @Input() cockpitId!: string;
  @Input() indicadores: IndicadorCockpit[] = [];
  @Input() empresaId!: string;

  private cockpitService = inject(CockpitPilaresService);

  selectedIndicadorId: string | null = null;
  indicador: IndicadorCockpit | null = null;
  loading = false;
  error: string | null = null;

  // R-GRAF-001: Propriedades para seleção de filtro (anos + últimos 12 meses)
  opcoesAnos: { value: string; label: string }[] = [];
  private readonly ANO_CORRENTE = normalizeDateToSaoPaulo(new Date()).getFullYear().toString();
  selectedFiltro: string = this.ANO_CORRENTE; // Padrão: Ano corrente

  // ng2-charts configuration
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: [],
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          generateLabels: (chart) => {
          // Gerar labels padrão dos datasets
          const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
          
          original.pop();
          // Adicionar labels customizados
          original.push({
            text: 'Meta não alcançada',
            fillStyle: 'rgba(220, 53, 69, 0.7)',
            strokeStyle: '#dc3545',
            lineWidth: 1,
            hidden: false,
            datasetIndex: -1,
            pointStyle: 'rect',
          });

          original.push({
            text: 'Meta alcançada',
            fillStyle: 'rgba(25, 135, 84, 0.7)',
            strokeStyle: '#198754',
            lineWidth: 1,
            hidden: false,
            datasetIndex: -1,
            pointStyle: 'rect',
          });

          
          
          return original;
        },
          font: {
            size: 12,
          },
          usePointStyle: true,
          pointStyleWidth: 35,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const indicador = this.indicadores.find(
              (i) => i.id === this.selectedIndicadorId
            );

            // if (indicador) {
              //const suffix = this.getTipoMedidaSuffix(indicador.tipoMedida);
              //return `${label}: ${value?.toFixed(2) || '-'}${suffix}`;
            // }

            return `${label}: ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}`;
          },
        },
      },
      datalabels: {
        display: true,
        rotation: (context) => {
          // Vertical para barras, horizontal para linha
          return context.dataset.type === 'bar' ? -90 : 0;
        },
        color: '#000000',
        font: {
          size: 12,
          weight: 'bold' as const,
        },
        formatter: (value, context) => {
          if (value === null || value === undefined) return '';
          
          const indicador = this.indicadores.find(
            (i) => i.id === this.selectedIndicadorId
          );
          //const suffix = indicador ? this.getTipoMedidaSuffix(indicador.tipoMedida) : '';
          
          //return `${value.toFixed(1)}${suffix}`;
          return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
        },
        anchor: (context) => {
          // Centro para barras, end para linha
          return context.dataset.type === 'bar' ? 'start' : 'end';
        },
        align: (context) => {
          // Centro para barras, top para linha
          return context.dataset.type === 'bar' ? 'end' : 'top';
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            const indicador = this.indicadores.find(
              (i) => i.id === this.selectedIndicadorId
            );
            // const suffix = indicador
            //   ? this.getTipoMedidaSuffix(indicador.tipoMedida)
            //   : '';
            // return `${value}${suffix}`;
            return `${value}`;
          },
        },
      },
    },
  };

  public lineChartType: ChartType = 'bar';

  ngOnInit(): void {
    this.loadAnosDisponiveis();
    this.loadIndicadores();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recarregar quando cockpitId mudar
    if (changes['cockpitId'] && !changes['cockpitId'].firstChange) {
      this.loadIndicadores();
    }
  }

  /**
   * Carregar indicadores do cockpit
   */
  private loadIndicadores(): void {
    if (!this.cockpitId) return;

    this.loading = true;
    this.cockpitService.getCockpitById(this.cockpitId).subscribe({
      next: (cockpit) => {
        this.indicadores = cockpit.indicadores || [];
        if (this.indicadores.length > 0) {
          this.selectedIndicadorId = this.indicadores[0].id;
          this.indicador = this.indicadores[0];
          this.loadGrafico();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar indicadores:', err);
        this.error = err?.error?.message || 'Erro ao carregar indicadores';
        this.loading = false;
      }
    });
  }

  onIndicadorChange(indicadorId: string | null): void {
    if (indicadorId) {
      this.indicador = this.indicadores.find(i => i.id === indicadorId) || null;
      this.loadGrafico();
    } else {
      this.indicador = null;
      this.error = null;
      this.lineChartData = { datasets: [], labels: [] };
    }
  }

  loadGrafico(): void {
    if (!this.selectedIndicadorId || !this.selectedFiltro) {
      return;
    }

    this.loading = true;
    this.error = null;

    // R-GRAF-001: Passar filtro (ano ou 'ultimos-12-meses')
    this.cockpitService.getDadosGraficos(
      this.cockpitId,
      this.selectedFiltro
    ).subscribe({
      next: (dados: DadosGraficos) => {
        // Encontra o indicador selecionado
        const indicador = dados.indicadores.find(
          (ind) => ind.id === this.selectedIndicadorId
        );
        if (indicador) {
          this.buildChart(indicador);
        }
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar dados do gráfico:', err);
        const message = (err as any)?.error?.message ||
          'Erro ao carregar dados do gráfico. Tente novamente mais tarde.';
        this.error = message;
        this.loading = false;
      },
    });
  }

  private buildChart(indicador: IndicadorCockpit): void {
    // Ordenar meses por ano e mês
    const mesesData = (indicador.mesesIndicador || []).sort((a, b) => {
      if (a.ano !== b.ano) {
        return a.ano - b.ano;
      }
      return (a.mes || 0) - (b.mes || 0);
    });
    
    // R-GRAF-001: Usar labels dinâmicos com mês + ano (ex: Jan/25, Fev/25...)
    const meses = mesesData.map((m) => {
      if (m.mes && m.ano) {
        const mes = String(m.mes).padStart(2, '0');
        return formatMonthYearSaoPaulo(
          parseDateInputSaoPaulo(`${m.ano}-${mes}-01`),
        );
      }
      return this.getNomeMes(m.mes!);
    });
    
    const metas = mesesData.map((m) => m.meta || null);
    const realizados = mesesData.map((m) => m.realizado || null);
    const historicos = mesesData.map((m) => m.historico || null);

    // Calcular cores das barras baseado no status (verde/vermelho)
    const coresBarras = mesesData.map((m) => {
      const status = this.calcularStatus(indicador, m.meta, m.realizado);
      if (status === 'success') return 'rgba(25, 135, 84, 0.7)'; // Bootstrap success
      if (status === 'danger') return 'rgba(220, 53, 69, 0.7)'; // Bootstrap danger
      return 'rgba(170, 170, 170, 0.7)'; // Cinza (sem dados)
    });

    const coresBordasBarras = mesesData.map((m) => {
      const status = this.calcularStatus(indicador, m.meta, m.realizado);
      if (status === 'success') return '#198754'; // Bootstrap success
      if (status === 'danger') return '#dc3545'; // Bootstrap danger
      return '#AAAAAA'; // Cinza
    });

    this.lineChartData = {
      labels: meses,
      datasets: [
        {
          type: 'bar',
          label: 'Histórico',
          data: historicos,
          backgroundColor: 'rgba(200, 200, 200, 0.5)',
          borderColor: 'rgba(150, 150, 150, 0.8)',
          borderWidth: 1,
          order: 2,
          pointStyle: 'rect',
        },
        {
          type: 'line',
          label: 'Meta',
          data: metas,
          borderColor: '#000000',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          order: 1,
          pointStyle: 'line',
        },
        {
          type: 'bar',
          label: 'Realizado',
          data: realizados,
          backgroundColor: coresBarras,
          borderColor: coresBordasBarras,
          borderWidth: 1,
          order: 3,
        },
      ],
    };
  }

  /**
   * Calcula status do mês (verde/vermelho) baseado no desvio
   */
  private calcularStatus(
    indicador: IndicadorCockpit,
    meta: number | null | undefined,
    realizado: number | null | undefined
  ): 'success' | 'danger' | null {
    if (!meta || !realizado) return null;

    const percentual = (realizado / meta) * 100;

    if (indicador.melhor === DirecaoIndicador.MAIOR) {
      if (percentual >= 100) return 'success'; // Verde
      return 'danger'; // Vermelho
    } else {
      if (percentual <= 100) return 'success'; // Verde
      return 'danger'; // Vermelho
    }
  }

  private getNomeMes(mes: number): string {
    const nomes = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    return nomes[mes - 1] || '';
  }

  private getTipoMedidaSuffix(tipo: string): string {
    switch (tipo) {
      case 'REAL':
        return ' (R$)';
      case 'PERCENTUAL':
        return ' (%)';
      case 'TEMPO':
        return ' (Tempo)';
      case 'QUANTIDADE':
        return ' (Qtde)';
      default:
        return '';
    }
  }

  getLabelTipoMedida(tipo: string): string {
    switch (tipo) {
      case 'REAL':
        return '(R$)';
      case 'PERCENTUAL':
        return '(%)';
      case 'TEMPO':
        return '(Tempo)';
      case 'QUANTIDADE':
        return '(Qtde)';
      default:
        return tipo;
    }
  }

  /**
   * R-GRAF-001: Carregar anos disponíveis para filtro do gráfico
   */
  private loadAnosDisponiveis(): void {
    if (!this.cockpitId) {
      console.warn('cockpitId não fornecido para carregar anos disponíveis');
      return;
    }

    this.cockpitService.getAnosDisponiveis(this.cockpitId).subscribe({
      next: (anos: number[]) => {
        const anosUnicos = Array.from(new Set(anos));
        const anoCorrente = Number(this.ANO_CORRENTE);
        if (!anosUnicos.includes(anoCorrente)) {
          anosUnicos.push(anoCorrente);
        }
        const anosOrdenados = anosUnicos.sort((a, b) => b - a);

        // Adicionar anos disponíveis + opção "Últimos 12 meses" por último
        this.opcoesAnos = [
          ...anosOrdenados.map(ano => ({ value: ano.toString(), label: ano.toString() })),
          { value: 'ultimos-12-meses', label: 'Últimos 12 meses' }
        ];
        
        // Verificar se há filtro salvo no localStorage
        const filtroSalvo = localStorage.getItem(`filtroGrafico_${this.cockpitId}`);
        
        if (filtroSalvo && this.opcoesAnos.find(o => o.value === filtroSalvo)) {
          this.selectedFiltro = filtroSalvo;
        } else {
          // Padrão: Ano corrente
          this.selectedFiltro = this.ANO_CORRENTE;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar anos disponíveis:', err);
        // Fallback: Ano corrente + "Últimos 12 meses"
        this.opcoesAnos = [
          { value: this.ANO_CORRENTE, label: this.ANO_CORRENTE },
          { value: 'ultimos-12-meses', label: 'Últimos 12 meses' }
        ];
        this.selectedFiltro = this.ANO_CORRENTE;
      }
    });
  }

  /**
   * R-GRAF-001: Callback quando filtro é alterado no dropdown
   */
  onFiltroChange(filtro: string | null): void {
    if (!filtro) {
      this.selectedFiltro = this.ANO_CORRENTE;
      return;
    }

    this.selectedFiltro = filtro;

    // Persistir seleção no localStorage
    if (this.cockpitId) {
      localStorage.setItem(`filtroGrafico_${this.cockpitId}`, filtro);
    }

    // Recarregar gráfico com novo filtro
    this.loadGrafico();
  }

  /**
   * Formatar label do filtro para display
   */
  getFiltroLabel(opcao: { value: string; label: string }): string {
    return opcao.label;
  }
}
