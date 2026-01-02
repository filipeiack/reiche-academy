import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { DiagnosticoNotasService, MediaPilar, HistoricoEvolucao } from '../../../core/services/diagnostico-notas.service';
import { EmpresasService, Empresa } from '../../../core/services/empresas.service';
import { EmpresaBasic } from '@app/core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(...registerables, annotationPlugin);

@Component({
  selector: 'app-diagnostico-evolucao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    NgbAlertModule,
    TranslatePipe
  ],
  templateUrl: './diagnostico-evolucao.component.html',
  styleUrl: './diagnostico-evolucao.component.scss'
})
export class DiagnosticoEvolucaoComponent implements OnInit {
  private diagnosticoService = inject(DiagnosticoNotasService);
  private empresasService = inject(EmpresasService);
  private authService = inject(AuthService);

  empresas: Empresa[] = [];
  empresaLogada: EmpresaBasic | null = null;
  selectedEmpresaId: string | null = null;
  isAdmin = false;
  loading = false;
  error = '';

  medias: MediaPilar[] = [];
  historico: any[] = []; // Agora armazena histórico de todos os pilares
  chart: Chart | null = null;

  canCongelar = false; // ADMINISTRADOR, CONSULTOR, GESTOR

  // Paleta de cores para os pilares
  private readonly COLORS = [
    { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.2)' },
    { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.2)' },
    { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.2)' },
    { border: 'rgb(255, 206, 86)', bg: 'rgba(255, 206, 86, 0.2)' },
    { border: 'rgb(153, 102, 255)', bg: 'rgba(153, 102, 255, 0.2)' },
    { border: 'rgb(255, 159, 64)', bg: 'rgba(255, 159, 64, 0.2)' },
    { border: 'rgb(199, 199, 199)', bg: 'rgba(199, 199, 199, 0.2)' },
    { border: 'rgb(83, 102, 255)', bg: 'rgba(83, 102, 255, 0.2)' },
    { border: 'rgb(255, 102, 196)', bg: 'rgba(255, 102, 196, 0.2)' },
    { border: 'rgb(102, 255, 178)', bg: 'rgba(102, 255, 178, 0.2)' }
  ];

  ngOnInit(): void {
    this.checkUserPerfil();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
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
      this.loadEmpresas();
    } else if (user.empresaId) {
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

  private loadEmpresas(): void {
    this.empresasService.getAll().subscribe({
      next: (data) => {
        this.empresas = data;
      },
      error: (err) => {
        this.showToast('Erro ao carregar empresas', 'error');
      }
    });
  }

  onEmpresaChange(event: any): void {
    const empresaId = typeof event === 'string' ? event : event?.id || this.selectedEmpresaId;
    this.selectedEmpresaId = empresaId;
    if (empresaId) {
      this.loadMedias();
    } else {
      this.medias = [];
      this.destroyChart();
    }
  }

  private loadMedias(): void {
    if (!this.selectedEmpresaId) return;

    this.loading = true;
    this.error = '';
    this.medias = [];
    this.destroyChart();

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
      text: `Deseja congelar as médias de ${this.medias.length} pilar(es)?`,
      showCancelButton: true,
      confirmButtonText: 'Sim, congelar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed && this.selectedEmpresaId) {
        this.loading = true;
        this.diagnosticoService.congelarMedias(this.selectedEmpresaId).subscribe({
          next: (response) => {
            this.showToast(
              `${response.totalPilaresCongelados} pilar(es) congelado(s) com sucesso!`,
              'success'
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
      this.destroyChart();
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
        this.renderChart();
      }, 100);
    } catch (err) {
      console.error('Erro ao carregar histórico de pilares:', err);
      this.showToast('Erro ao carregar histórico', 'error');
      this.historico = [];
      this.destroyChart();
    }
  }

  private renderChart(): void {
    this.destroyChart();

    if (this.historico.length === 0) {
      return;
    }

    const ctx = document.getElementById('evolucaoChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Coletar todas as datas únicas de todos os pilares
    const allDates = new Set<string>();
    this.historico.forEach(pilar => {
      pilar.data.forEach((item: HistoricoEvolucao) => {
        allDates.add(new Date(item.createdAt).toLocaleDateString('pt-BR'));
      });
    });
    const labels = Array.from(allDates).sort((a, b) => {
      const dateA = a.split('/').reverse().join('-');
      const dateB = b.split('/').reverse().join('-');
      return dateA.localeCompare(dateB);
    });

    // Criar dataset para cada pilar
    const datasets = this.historico.map((pilar, index) => {
      const colorIndex = index % this.COLORS.length;
      const color = this.COLORS[colorIndex];

      // Mapear dados do pilar para as datas correspondentes
      const data = labels.map(label => {
        const item = pilar.data.find((h: HistoricoEvolucao) => 
          new Date(h.createdAt).toLocaleDateString('pt-BR') === label
        );
        return item ? item.mediaNotas : null;
      });

      return {
        label: pilar.pilarNome,
        data: data,
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.3,
        fill: false,
        spanGaps: true // Conecta pontos mesmo se houver valores null
      };
    });

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
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
              text: 'Data'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            onClick: (e, legendItem, legend) => {
              // Permitir ocultar/mostrar linhas clicando na legenda
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
              // Zona Vermelha: 0-6
              zonaVermelha: {
                type: 'box',
                yMin: 0,
                yMax: 6,
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderColor: 'rgba(255, 99, 132, 0.3)',
                borderWidth: 1,
                drawTime: 'beforeDatasetsDraw'
              },
              // Zona Amarela: 6-8
              zonaAmarela: {
                type: 'box',
                yMin: 6,
                yMax: 8,
                backgroundColor: 'rgba(255, 206, 86, 0.1)',
                borderColor: 'rgba(255, 206, 86, 0.3)',
                borderWidth: 1,
                drawTime: 'beforeDatasetsDraw'
              },
              // Zona Verde: 8-10
              zonaVerde: {
                type: 'box',
                yMin: 8,
                yMax: 10,
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderColor: 'rgba(75, 192, 192, 0.3)',
                borderWidth: 1,
                drawTime: 'beforeDatasetsDraw'
              }
            }
          }
        }
      }
    });
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  getProgressColor(percentual: number): string {
    if (percentual >= 80) return 'success';
    if (percentual >= 50) return 'warning';
    return 'danger';
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
