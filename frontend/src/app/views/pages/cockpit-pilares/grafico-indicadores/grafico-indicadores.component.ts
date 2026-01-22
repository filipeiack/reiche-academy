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
import { PeriodosMentoriaService, PeriodoMentoria } from '@core/services/periodos-mentoria.service';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  @Input() empresaId!: string; // Necessário para buscar períodos de mentoria

  private cockpitService = inject(CockpitPilaresService);
  private periodosMentoriaService = inject(PeriodosMentoriaService);

  selectedIndicadorId: string | null = null;
  indicador: IndicadorCockpit | null = null;
  anoAtual = new Date().getFullYear();
  loading = false;
  error: string | null = null;

  // R-MENT-008: Propriedades para seleção de período
  periodosMentoria: PeriodoMentoria[] = [];
  selectedPeriodoId: string | null = null;
  mesesPeriodo: { mes: number; ano: number; label: string }[] = [];

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
          usePointStyle: true,
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

            return `${label}: ${value?.toFixed(2) || '-'}`;
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
          return `${value.toFixed(1)}`;
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
    this.loadPeriodos();
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

    // R-MENT-008: Passar periodoMentoriaId se selecionado
    this.cockpitService.getDadosGraficos(
      this.cockpitId, 
      this.anoAtual,
      this.selectedPeriodoId || undefined
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
        this.error =
          'Erro ao carregar dados do gráfico. Tente novamente mais tarde.';
        this.loading = false;
      },
    });
  }

  private buildChart(indicador: IndicadorCockpit): void {
    const mesesData = indicador.mesesIndicador || [];
    
    // R-MENT-009: Usar labels dinâmicos com mês + ano (ex: Mai/26)
    const meses = mesesData.map((m) => {
      if (m.mes && m.ano) {
        const date = new Date(m.ano, m.mes - 1, 1);
        return format(date, 'MMM/yy', { locale: ptBR });
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
        return ' (ts)';
      case 'QUANTIDADE':
        return ' (un)';
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

  /**
   * R-MENT-008: Carregar períodos de mentoria da empresa
   */
  private loadPeriodos(): void {
    if (!this.empresaId) {
      console.warn('empresaId não fornecido para carregar períodos');
      return;
    }

    this.periodosMentoriaService.listarPorEmpresa(this.empresaId).subscribe({
      next: (periodos) => {
        this.periodosMentoria = periodos;
        
        // Verificar se há período selecionado no localStorage
        const periodoSalvo = localStorage.getItem(`periodoSelecionado_${this.empresaId}`);
        
        if (periodoSalvo && periodos.find(p => p.id === periodoSalvo)) {
          this.selectedPeriodoId = periodoSalvo;
        } else if (periodos.length > 0) {
          // Selecionar período ativo por padrão
          const periodoAtivo = periodos.find(p => p.ativo);
          this.selectedPeriodoId = periodoAtivo?.id || periodos[0].id;
        }

        // Calcular meses do período selecionado
        if (this.selectedPeriodoId) {
          const periodo = periodos.find(p => p.id === this.selectedPeriodoId);
          if (periodo) {
            this.mesesPeriodo = this.calcularMesesPeriodo(periodo);
          }
        }
      },
      error: (err) => {
        console.error('Erro ao carregar períodos de mentoria:', err);
      }
    });
  }

  /**
   * R-MENT-008: Formatar label do período para dropdown
   * Formato: "Período 1 (Mai/26 - Abr/27)"
   */
  getPeriodoLabel(periodo: PeriodoMentoria): string {
    const inicio = format(new Date(periodo.dataInicio), 'MMM/yy', { locale: ptBR });
    const fim = format(new Date(periodo.dataFim), 'MMM/yy', { locale: ptBR });
    return `Período ${periodo.numero} (${inicio} - ${fim})`;
  }

  /**
   * R-MENT-008: Callback quando período é alterado no dropdown
   */
  onPeriodoChange(periodoId: string | null): void {
    if (!periodoId) {
      this.selectedPeriodoId = null;
      this.mesesPeriodo = [];
      return;
    }

    this.selectedPeriodoId = periodoId;

    // Persistir seleção no localStorage
    if (this.empresaId) {
      localStorage.setItem(`periodoSelecionado_${this.empresaId}`, periodoId);
    }

    // Calcular meses do período selecionado
    const periodo = this.periodosMentoria.find(p => p.id === periodoId);
    if (periodo) {
      this.mesesPeriodo = this.calcularMesesPeriodo(periodo);
    }

    // Recarregar gráfico com novo período
    this.loadGrafico();
  }

  /**
   * R-MENT-009: Calcular meses do período dinamicamente
   * Gera array de objetos { mes, ano, label } de dataInicio até dataFim
   */
  calcularMesesPeriodo(periodo: PeriodoMentoria): { mes: number; ano: number; label: string }[] {
    const meses: { mes: number; ano: number; label: string }[] = [];
    
    let dataAtual = new Date(periodo.dataInicio);
    const dataFinal = new Date(periodo.dataFim);
    
    while (dataAtual <= dataFinal) {
      const mes = dataAtual.getMonth() + 1; // 1-12
      const ano = dataAtual.getFullYear();
      const label = format(dataAtual, 'MMM/yy', { locale: ptBR }); // "Mai/26"
      
      meses.push({ mes, ano, label });
      
      dataAtual = addMonths(dataAtual, 1);
    }
    
    return meses;
  }
}
