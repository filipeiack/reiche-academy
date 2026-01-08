import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbAlertModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import Swal from 'sweetalert2';
import { firstValueFrom, Subscription } from 'rxjs';
import { DiagnosticoNotasService, MediaPilar, HistoricoEvolucao } from '../../../core/services/diagnostico-notas.service';
import { EmpresasService, Empresa } from '../../../core/services/empresas.service';
import { EmpresaBasic } from '@app/core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresaContextService } from '../../../core/services/empresa-context.service';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { MediaBadgeComponent } from '../../../shared/components/media-badge/media-badge.component';

Chart.register(...registerables, annotationPlugin);

@Component({
  selector: 'app-diagnostico-evolucao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    NgbAlertModule,
    TranslatePipe,
    NgbTooltip,
    MediaBadgeComponent
],
  templateUrl: './diagnostico-evolucao.component.html',
  styleUrl: './diagnostico-evolucao.component.scss'
})
export class DiagnosticoEvolucaoComponent implements OnInit, OnDestroy {
  private diagnosticoService = inject(DiagnosticoNotasService);
  private empresasService = inject(EmpresasService);
  private authService = inject(AuthService);
  private empresaContextService = inject(EmpresaContextService);

  empresaLogada: EmpresaBasic | null = null;
  selectedEmpresaId: string | null = null;
  isAdmin = false;
  loading = false;
  error = '';
  
  private empresaContextSubscription?: Subscription;

  medias: MediaPilar[] = [];
  historico: any[] = []; // Agora armazena histórico de todos os pilares
  barChart: Chart | null = null;

  canCongelar = false; // ADMINISTRADOR, CONSULTOR, GESTOR

  // Paleta de tons de cinza para o gráfico de barras
  private readonly GRAY_COLORS = [
    'rgb(44, 62, 80)',    // Cinza muito escuro
    'rgb(52, 73, 94)',    // Cinza escuro
    'rgb(69, 90, 100)',   // Cinza médio-escuro
    'rgb(96, 125, 139)',  // Cinza médio
    'rgb(120, 144, 156)', // Cinza médio-claro
    'rgb(149, 165, 166)', // Cinza claro
    'rgb(176, 190, 197)', // Cinza muito claro
    'rgb(189, 195, 199)', // Cinza clarinho
    'rgb(204, 209, 209)', // Cinza bem claro
    'rgb(220, 221, 225)'  // Cinza quase branco
  ];

  ngOnInit(): void {
    this.checkUserPerfil();
    
    // Subscrever às mudanças no contexto de empresa
    this.empresaContextSubscription = this.empresaContextService.selectedEmpresaId$.subscribe(empresaId => {
      if (this.isAdmin && empresaId !== this.selectedEmpresaId) {
        this.selectedEmpresaId = empresaId;
        if (empresaId) {
          this.loadMedias();
        } else {
          this.medias = [];
          this.destroyBarChart();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.empresaContextSubscription?.unsubscribe();
    if (this.barChart) {
      this.barChart.destroy();
    }
  }

  private checkUserPerfil(): void {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.error = 'Usuário não autenticado';
      return;
    }

    this.isAdmin = user.perfil?.codigo === 'ADMINISTRADOR';
    this.canCongelar = ['ADMINISTRADOR', 'CONSULTOR', 'GESTOR'].includes(user.perfil?.codigo);

    if (this.isAdmin) {
      // Admin: usar empresa do contexto global (selecionada no navbar)
      this.selectedEmpresaId = this.empresaContextService.getEmpresaId();
      if (this.selectedEmpresaId) {
        this.loadMedias();
      }
    } else if (user.empresaId) {
      // Perfil cliente: usar empresa do usuário logado
      this.empresaLogada = {
        id: user.empresaId,
        nome: user.empresa?.nome || '',
        cnpj: user.empresa?.cnpj || '',
        cidade: user.empresa?.cidade || '',
        estado: user.empresa?.estado,
      };
      this.selectedEmpresaId = user.empresaId;
      this.loadMedias();
    } else {
      this.error = 'Usuário sem empresa associada';
    }
  }

  private loadMedias(): void {
    if (!this.selectedEmpresaId) return;

    this.loading = true;
    this.error = '';
    this.medias = [];
    this.destroyBarChart();

    this.diagnosticoService.calcularMediasPilares(this.selectedEmpresaId).subscribe({
      next: (data) => {
        this.medias = data;
        this.loading = false;
        // Carregar histórico de todos os pilares
        this.loadAllHistorico();
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Erro ao carregar médias dos pilares';
        this.loading = false;
        this.showToast(this.error, 'error');
      }
    });
  }

  congelarMedias(): void {
    if (!this.selectedEmpresaId || !this.canCongelar) return;

    if (this.medias.length === 0) {
      this.showToast('Não há médias para congelar', 'warning');
      return;
    }

    Swal.fire({
      title: 'Congelar Médias',
      text: `Deseja salvar/atualizar as médias de ${this.medias.length} pilar(es)? Se já existe registro de hoje, será atualizado.`,
      showCancelButton: true,
      confirmButtonText: 'Sim, salvar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed && this.selectedEmpresaId) {
        this.loading = true;
        this.diagnosticoService.congelarMedias(this.selectedEmpresaId).subscribe({
          next: (response) => {
            this.showToast(
              response.message,
              'success',
              4000
            );
            this.loading = false;
            // Recarregar histórico de todos os pilares
            this.loadAllHistorico();
          },
          error: (err: any) => {
            this.loading = false;
            this.showToast(
              err?.error?.message || 'Erro ao congelar médias',
              'error'
            );
          }
        });
      }
    });
  }

  /**
   * Carrega histórico de todos os pilares
   */
  private async loadAllHistorico(): Promise<void> {
    if (!this.selectedEmpresaId || this.medias.length === 0) {
      this.historico = [];
      this.destroyBarChart();
      return;
    }

    try {
      // Fazer requisições paralelas para todos os pilares
      const promises = this.medias.map(media =>
        firstValueFrom(
          this.diagnosticoService.buscarHistoricoEvolucao(this.selectedEmpresaId!, media.pilarEmpresaId)
        ).catch(err => {
          console.error(`Erro ao carregar histórico do pilar ${media.pilarNome}:`, err);
          return []; // Retorna array vazio em caso de erro
        })
      );

      const results = await Promise.all(promises);

      // Combinar resultados com informações do pilar
      this.historico = results
        .map((data, index) => ({
          pilarEmpresaId: this.medias[index].pilarEmpresaId,
          pilarNome: this.medias[index].pilarNome,
          data: data || []
        }))
        .filter(h => h.data.length > 0);
      
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        this.renderBarChart();
      }, 100);
    } catch (err) {
      console.error('Erro ao carregar histórico de pilares:', err);
      this.showToast('Erro ao carregar histórico', 'error');
      this.historico = [];
      this.destroyBarChart();
    }
  }

renderBarChart(): void {
    this.destroyBarChart();

    if (this.historico.length === 0) {
      return;
    }

    const ctx = document.getElementById('evolucaoBarChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Coletar todas as datas únicas de todos os pilares e ordenar
    const allDates = new Set<string>();
    this.historico.forEach(pilar => {
      pilar.data.forEach((item: HistoricoEvolucao) => {
        allDates.add(new Date(item.createdAt).toLocaleDateString('pt-BR'));
      });
    });
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dateA = a.split('/').reverse().join('-');
      const dateB = b.split('/').reverse().join('-');
      return dateA.localeCompare(dateB);
    });

    // Labels são os nomes dos pilares
    const labels = this.historico.map(pilar => pilar.pilarNome);

    // Criar dataset para cada data
    const datasets = sortedDates.map((date, index) => {
      const colorIndex = index % this.GRAY_COLORS.length;
      const grayColor = this.GRAY_COLORS[colorIndex];

      // Para cada pilar, pegar a média da data correspondente
      const data = this.historico.map(pilar => {
        const item = pilar.data.find((h: HistoricoEvolucao) => 
          new Date(h.createdAt).toLocaleDateString('pt-BR') === date
        );
        return item ? item.mediaNotas : null;
      });

      return {
        label: date,
        data: data,
        backgroundColor: grayColor,
        borderColor: grayColor,
        borderWidth: 1,
        barPercentage: 1.05,
        categoryPercentage: 0.75
      };
    });

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets
      },
      plugins: [{
        id: 'datalabels',
        afterDatasetsDraw: (chart: any) => {
          const ctx = chart.ctx;
          // Obter a cor do texto do tema atual
          const textColor = getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color').trim() || '#212121';
          
          chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta.hidden) {
              meta.data.forEach((bar: any, index: number) => {
                const data = dataset.data[index];
                if (data !== null && data !== undefined) {
                  ctx.fillStyle = textColor;
                  ctx.font = 'bold 11px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'bottom';
                  ctx.fillText(data.toFixed(1), bar.x, bar.y - 5);
                }
              });
            }
          });
        }
      }],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            ticks: {
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Média das Notas'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Pilar'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            onClick: (e, legendItem, legend) => {
              const index = legendItem.datasetIndex!;
              const ci = legend.chart;
              if (ci.isDatasetVisible(index)) {
                ci.hide(index);
                legendItem.hidden = true;
              } else {
                ci.show(index);
                legendItem.hidden = false;
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          },
          annotation: {
            annotations: {
              // Zona Vermelha: 0-6 (usando cor do tema $danger: #C34D38)
              zonaVermelha: {
                type: 'box',
                yMin: 0,
                yMax: 6,
                backgroundColor: 'rgba(195, 77, 56, 0.3)',
                borderWidth: 0,
                drawTime: 'beforeDatasetsDraw'
              },
              // Zona Amarela: 6-8 (usando cor do tema $warning: #A67C00)
              zonaAmarela: {
                type: 'box',
                yMin: 6,
                yMax: 8,
                backgroundColor: 'rgba(166, 124, 0, 0.3)',
                borderWidth: 0,
                drawTime: 'beforeDatasetsDraw'
              },
              // Zona Verde: 8-10 (usando cor do tema $success: #5CB870)
              zonaVerde: {
                type: 'box',
                yMin: 8,
                yMax: 10,
                backgroundColor: 'rgba(92, 184, 112, 0.3)',
                borderWidth: 0,
                drawTime: 'beforeDatasetsDraw'
              }
            }
          }
        }
      }
    });
  }

  private destroyBarChart(): void {
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }
  }

  getProgressColor(percentual: number): string {
    if (percentual >= 80) return 'success';
    if (percentual >= 50) return 'warning';
    return 'danger';
  }

  getSortedMedias(): MediaPilar[] {
    return [...this.medias].sort((a, b) => b.mediaAtual - a.mediaAtual);
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      title,
      icon
    });
  }
}
