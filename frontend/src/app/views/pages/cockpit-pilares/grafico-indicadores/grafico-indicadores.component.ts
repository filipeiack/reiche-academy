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

  private cockpitService = inject(CockpitPilaresService);

  selectedIndicadorId: string | null = null;
  indicador: IndicadorCockpit | null = null;
  anoAtual = new Date().getFullYear();
  loading = false;
  error: string | null = null;

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
          font: {
            size: 12,
          },
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

            if (indicador) {
              const suffix = this.getTipoMedidaSuffix(indicador.tipoMedida);
              return `${label}: ${value?.toFixed(2) || '-'}${suffix}`;
            }

            return `${label}: ${value?.toFixed(2) || '-'}`;
          },
        },
      },
      datalabels: {
        display: true,
        color: (context) => {
          // Branco para barras, preto para linha
          return context.dataset.type === 'bar' ? '#FFFFFF' : '#000000';
        },
        font: {
          size: 11,
          weight: 'bold' as const,
        },
        formatter: (value, context) => {
          if (value === null || value === undefined) return '';
          
          const indicador = this.indicadores.find(
            (i) => i.id === this.selectedIndicadorId
          );
          const suffix = indicador ? this.getTipoMedidaSuffix(indicador.tipoMedida) : '';
          
          return `${value.toFixed(1)}${suffix}`;
        },
        anchor: (context) => {
          // Centro para barras, end para linha
          return context.dataset.type === 'bar' ? 'center' : 'end';
        },
        align: (context) => {
          // Centro para barras, top para linha
          return context.dataset.type === 'bar' ? 'center' : 'top';
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
            const suffix = indicador
              ? this.getTipoMedidaSuffix(indicador.tipoMedida)
              : '';
            return `${value}${suffix}`;
          },
        },
      },
    },
  };

  public lineChartType: ChartType = 'bar';

  ngOnInit(): void {
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
        this.error = 'Erro ao carregar indicadores';
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
    if (!this.selectedIndicadorId) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.cockpitService.getDadosGraficos(this.cockpitId, this.anoAtual).subscribe({
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
        this.error =
          'Erro ao carregar dados do gráfico. Tente novamente mais tarde.';
        this.loading = false;
      },
    });
  }

  private buildChart(indicador: IndicadorCockpit): void {
    const mesesData = indicador.mesesIndicador || [];
    const meses = mesesData.map((m) => this.getNomeMes(m.mes!));
    const metas = mesesData.map((m) => m.meta || null);
    const realizados = mesesData.map((m) => m.realizado || null);

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
          type: 'line',
          label: 'Meta',
          data: metas,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
        },
        {
          type: 'bar',
          label: 'Realizado',
          data: realizados,
          backgroundColor: coresBarras,
          borderColor: coresBordasBarras,
          borderWidth: 1,
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
        return ' R$';
      case 'PERCENTUAL':
        return ' %';
      case 'TEMPO':
        return ' ts';
      case 'QUANTIDADE':
        return ' un';
      default:
        return '';
    }
  }

  getLabelTipoMedida(tipo: string): string {
    switch (tipo) {
      case 'REAL':
        return 'Real (R$)';
      case 'PERCENTUAL':
        return 'Percentual (%)';
      case 'TEMPO':
        return 'Tempo';
      case 'QUANTIDADE':
        return 'Quantidade';
      default:
        return tipo;
    }
  }
}
