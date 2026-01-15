import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import {
  DadosGraficos,
  IndicadorCockpit,
} from '@core/interfaces/cockpit-pilares.interface';

@Component({
  selector: 'app-grafico-indicadores',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './grafico-indicadores.component.html',
  styleUrl: './grafico-indicadores.component.scss',
})
export class GraficoIndicadoresComponent implements OnInit, OnChanges {
  @Input() cockpitId!: string;
  @Input() indicadores: IndicadorCockpit[] = [];

  private cockpitService = inject(CockpitPilaresService);

  selectedIndicadorId: string | null = null;
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

  public lineChartType: ChartType = 'line';

  ngOnInit(): void {
    if (this.indicadores.length > 0) {
      this.selectedIndicadorId = this.indicadores[0].id;
      this.loadGrafico();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recarregar quando cockpitId ou indicadores mudarem
    if (changes['cockpitId'] && !changes['cockpitId'].firstChange) {
      if (this.indicadores.length > 0) {
        this.selectedIndicadorId = this.indicadores[0].id;
        this.loadGrafico();
      }
    } else if (changes['indicadores'] && !changes['indicadores'].firstChange) {
      if (this.indicadores.length > 0 && !this.selectedIndicadorId) {
        this.selectedIndicadorId = this.indicadores[0].id;
        this.loadGrafico();
      }
    }
  }

  onIndicadorChange(indicadorId: string): void {
    this.selectedIndicadorId = indicadorId;
    this.loadGrafico();
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

    this.lineChartData = {
      labels: meses,
      datasets: [
        {
          label: 'Meta',
          data: metas,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Realizado',
          data: realizados,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
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
        return '%';
      case 'TEMPO':
        return 'h';
      case 'QUANTIDADE':
        return '';
      default:
        return '';
    }
  }
}
