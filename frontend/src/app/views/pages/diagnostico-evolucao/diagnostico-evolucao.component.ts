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
import { PeriodosAvaliacaoService } from '../../../core/services/periodos-avaliacao.service';
import { PeriodoAvaliacao } from '../../../core/models/periodo-avaliacao.model';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { MediaBadgeComponent } from '../../../shared/components/media-badge/media-badge.component';
import { SortableDirective, SortEvent } from '../../../shared/directives/sortable.directive';

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
    MediaBadgeComponent,
    SortableDirective
],
  templateUrl: './diagnostico-evolucao.component.html',
  styleUrl: './diagnostico-evolucao.component.scss'
})
export class DiagnosticoEvolucaoComponent implements OnInit, OnDestroy {
  private diagnosticoService = inject(DiagnosticoNotasService);
  private empresasService = inject(EmpresasService);
  private authService = inject(AuthService);
  private empresaContextService = inject(EmpresaContextService);
  private periodosService = inject(PeriodosAvaliacaoService);

  empresaLogada: EmpresaBasic | null = null;
  selectedEmpresaId: string | null = null;
  isAdmin = false;
  loading = false;
  error = '';
  
  private empresaContextSubscription?: Subscription;

  medias: MediaPilar[] = [];
  historico: any[] = []; // Agora armazena histórico de todos os pilares
  barChart: Chart<'bar', any[], any> | null = null;
  periodoAtual: PeriodoAvaliacao | null = null;
  periodoCongelado: PeriodoAvaliacao | null = null; // Último período congelado (para recongelamento)
  anoFiltro: number | undefined = undefined;
  anosDisponiveis: number[] = [];

  canCongelar = false; // ADMINISTRADOR, CONSULTOR, GESTOR

  // Ordenação
  sortColumn: string = 'mediaAtual';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Paleta de tons de cinza para o gráfico de barras (do claro ao escuro)
  private readonly GRAY_COLORS = [
    'rgb(204, 204, 204)', // Cinza claro
    'rgb(189, 189, 189)', // Cinza claro-médio
    'rgb(170, 170, 170)', // Cinza médio-claro
    'rgb(150, 150, 150)', // Cinza médio
    'rgb(130, 130, 130)', // Cinza médio-escuro
    'rgb(110, 110, 110)', // Cinza escuro-médio
    'rgb(90, 90, 90)',    // Cinza escuro
    'rgb(70, 70, 70)',    // Cinza muito escuro
    'rgb(50, 50, 50)'     // Cinza quase preto
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
        // Gerar anos disponíveis (últimos 5 anos a partir do ano atual)
        this.gerarAnosDisponiveis();
        // Carregar período atual
        this.loadPeriodoAtual();
        // Carregar histórico com filtro de ano
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

    // Verificar se há período aberto ou congelado
    const periodo = this.periodoAtual || this.periodoCongelado;
    if (!periodo) {
      this.showToast('Não há período de avaliação. Inicie um período primeiro.', 'warning', 4000);
      return;
    }

    if (this.medias.length === 0) {
      this.showToast('Não há médias para congelar', 'warning');
      return;
    }

    // Determinar se é congelamento ou recongelamento
    const isRecongelamento = !periodo.aberto;
    const titulo = isRecongelamento ? 'Recongelar Médias do Período' : 'Congelar Médias do Período';
    const textoAcao = isRecongelamento 
      ? `Deseja atualizar os snapshots do período ${this.getPeriodoMesAno()} com as médias atuais de ${this.medias.length} pilar(es)? Os snapshots anteriores serão substituídos.`
      : `Deseja congelar as médias de ${this.medias.length} pilar(es) e encerrar o período ${this.getPeriodoMesAno()}?`;
    const botaoTexto = isRecongelamento ? 'Sim, recongelar' : 'Sim, congelar';

    Swal.fire({
      title: titulo,
      text: textoAcao,
      showCancelButton: true,
      confirmButtonText: botaoTexto,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed && periodo) {
        this.loading = true;
        
        // Chamar endpoint apropriado
        if (isRecongelamento) {
          this.periodosService.recongelar(periodo.id).subscribe({
            next: (response) => {
              const dataRef = new Date(response.periodo.dataReferencia);
              const mes = (dataRef.getMonth() + 1).toString().padStart(2, '0');
              const ano = dataRef.getFullYear();
              this.showToast(
                `Período ${mes}/${ano} recongelado com sucesso! ${response.resumo.totalSnapshots} snapshots atualizados.`,
                'success',
                4000
              );
              this.loading = false;
              // Recarregar histórico
              this.loadAllHistorico();
            },
            error: (err: any) => {
              this.loading = false;
              this.showToast(
                err?.error?.message || 'Erro ao recongelar médias',
                'error',
                4000
              );
            }
          });
        } else {
          this.periodosService.congelar(periodo.id).subscribe({
            next: (response) => {
              const dataRef = new Date(response.periodo.dataReferencia);
              const mes = (dataRef.getMonth() + 1).toString().padStart(2, '0');
              const ano = dataRef.getFullYear();
              this.showToast(
                `Período ${mes}/${ano} congelado com sucesso! ${response.snapshots.length} snapshots criados.`,
                'success',
                4000
              );
              this.periodoAtual = null;
              this.loading = false;
              // Recarregar histórico
              this.loadAllHistorico();
            },
            error: (err: any) => {
              this.loading = false;
              this.showToast(
                err?.error?.message || 'Erro ao congelar médias',
                'error',
                4000
              );
            }
          });
        }
      }
    });
  }

  /**
   * Carrega histórico de períodos congelados (baseado no novo endpoint)
   */
  private async loadAllHistorico(): Promise<void> {
    if (!this.selectedEmpresaId || this.medias.length === 0) {
      this.historico = [];
      this.destroyBarChart();
      return;
    }

    try {
      // Buscar histórico de períodos congelados com filtro de ano
      const periodos = await firstValueFrom(
        this.periodosService.getHistorico(this.selectedEmpresaId, this.anoFiltro)
      );

      // Converter períodos em estrutura de histórico para o chart
      // Cada período usa sua dataReferencia real
      this.historico = this.medias.map(media => {
        const dadosPilar = periodos
          .filter(p => !p.aberto) // Apenas períodos congelados
          .sort((a, b) => {
            // Ordenar por dataReferencia
            const dataA = new Date(a.dataReferencia);
            const dataB = new Date(b.dataReferencia);
            return dataA.getTime() - dataB.getTime();
          })
          .map(periodo => {
            // Buscar snapshot do pilar neste período
            const snapshot = periodo.snapshots?.find(s => s.pilarEmpresaId === media.pilarEmpresaId);
            return {
              data: periodo.dataReferencia, // Usar dataReferencia real escolhida pelo admin
              media: snapshot?.mediaNotas || null,
              trimestre: periodo.trimestre,
              ano: periodo.ano
            };
          })
          .filter(d => d.media !== null); // Remover períodos sem snapshot

        return {
          pilarEmpresaId: media.pilarEmpresaId,
          pilarNome: media.pilarNome,
          data: dadosPilar
        };
      }).filter(h => h.data.length > 0);
      
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

    // Labels são os nomes dos pilares
    const labels = this.historico.map(pilar => pilar.pilarNome.toUpperCase());

    // Configurar largura dinâmica do canvas
    const larguraMinimaPorPilar = 105; // pixels mínimos por pilar
    const larguraNecessaria = this.historico.length * larguraMinimaPorPilar;
    const container = document.getElementById('chartContainer');
    if (container && this.historico.length > 10) {
      container.style.width = `${larguraNecessaria}px`;
    } else if (container) {
      container.style.width = '100%';
    }

    // Criar dataset para cada período (mês/ano da dataReferencia real)
    // Coletar todos os períodos únicos
    interface PeriodoInfo {
      mesAno: string; // formato MM/YYYY
      data: Date;
    }
    const periodoMap = new Map<string, PeriodoInfo>();
    this.historico.forEach(pilar => {
      pilar.data.forEach((item: any) => {
        // Extrair mês/ano da dataReferencia real
        const dataRef = new Date(item.data);
        const mes = (dataRef.getMonth() + 1).toString().padStart(2, '0');
        const ano = dataRef.getFullYear();
        const mesAno = `${mes}/${ano}`;
        if (!periodoMap.has(mesAno)) {
          periodoMap.set(mesAno, {
            mesAno,
            data: dataRef
          });
        }
      });
    });
    // Ordenar por data
    const sortedPeriodos = Array.from(periodoMap.values()).sort((a, b) => {
      return a.data.getTime() - b.data.getTime();
    });

    // Criar dataset para cada período
    const datasets = sortedPeriodos.map((periodo, index) => {
      const colorIndex = index % this.GRAY_COLORS.length;
      const grayColor = this.GRAY_COLORS[colorIndex];

      // Para cada pilar, pegar a média do período correspondente
      const data = this.historico.map(pilar => {
        const item = pilar.data.find((h: any) => {
          const dataItem = new Date(h.data);
          const mesItem = (dataItem.getMonth() + 1).toString().padStart(2, '0');
          const anoItem = dataItem.getFullYear();
          const mesAnoItem = `${mesItem}/${anoItem}`;
          return mesAnoItem === periodo.mesAno;
        });
        return item ? item.media : null;
      });

      return {
        label: periodo.mesAno,
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
          
          chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta.hidden) {
              meta.data.forEach((bar: any, index: number) => {
                const data = dataset.data[index];
                if (data !== null && data !== undefined) {
                  ctx.fillStyle = '#000000';
                  ctx.font = 'bold 11px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  // Calcular posição Y no meio da barra
                  const yMid = (bar.y + bar.base) / 2;
                  ctx.fillText(data.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }), bar.x, yMid);
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
              text: 'MÉDIAS'
            }
          },
          x: {
            title: {
              display: true,
              text: 'PILARES'
            }
          }
        },
        plugins: {
          datalabels: {
            display: false // Desabilita labels automáticos do Chart.js (evita duplicação)
          },
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
                  label += context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
                backgroundColor: 'rgba(195, 77, 56, 0.5)',
                borderWidth: 0,
                drawTime: 'beforeDatasetsDraw'
              },
              // Zona Amarela: 6-8 (usando cor do tema $warning: #A67C00)
              zonaAmarela: {
                type: 'box',
                yMin: 6,
                yMax: 8,
                backgroundColor: 'rgba(166, 124, 0, 0.5)',
                borderWidth: 0,
                drawTime: 'beforeDatasetsDraw'
              },
              // Zona Verde: 8-10 (usando cor do tema $success: #5CB870)
              zonaVerde: {
                type: 'box',
                yMin: 8,
                yMax: 10,
                backgroundColor: 'rgba(92, 184, 112, 0.5)',
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

  onSort(event: SortEvent): void {
    const column = event.column;
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = event.direction as 'asc' | 'desc';
    }
  }

  getSortedMedias(): MediaPilar[] {
    const sorted = [...this.medias];
    
    if (!this.sortColumn) {
      // Ordenação padrão: por média decrescente
      return sorted.sort((a, b) => b.mediaAtual - a.mediaAtual);
    }

    // Aplicar ordenação
    sorted.sort((a: any, b: any) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];
      
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }

  /**
   * Formata data para exibição (dd/MM/yyyy HH:mm)
   */
  formatarData(data: string | null | undefined): string {
    if (!data) return '-';
    
    const date = new Date(data);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const ano = date.getFullYear();
    const hora = date.getHours().toString().padStart(2, '0');
    const minuto = date.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
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

  // ====================================================
  // Métodos de Período de Avaliação
  // ====================================================

  /**
   * Carrega o período de avaliação atual (aberto) da empresa
   */
  private loadPeriodoAtual(): void {
    if (!this.selectedEmpresaId) return;

    this.periodosService.getAtual(this.selectedEmpresaId).subscribe({
      next: (periodo) => {
        this.periodoAtual = periodo;
        
        // Se não há período aberto, carregar o último período congelado para permitir recongelamento
        if (!periodo) {
          this.loadUltimoPeriodoCongelado();
        } else {
          this.periodoCongelado = null;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar período atual:', err);
        this.periodoAtual = null;
        // Tentar carregar último período congelado
        this.loadUltimoPeriodoCongelado();
      }
    });
  }

  private loadUltimoPeriodoCongelado(): void {
    if (!this.selectedEmpresaId) return;

    this.periodosService.getHistorico(this.selectedEmpresaId).subscribe({
      next: (periodos) => {
        // Pegar o último período congelado (mais recente)
        if (periodos && periodos.length > 0) {
          // Ordenar por data de referência decrescente
          const periodosOrdenados = periodos.sort((a, b) => {
            return new Date(b.dataReferencia).getTime() - new Date(a.dataReferencia).getTime();
          });
          this.periodoCongelado = periodosOrdenados[0];
        } else {
          this.periodoCongelado = null;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar último período congelado:', err);
        this.periodoCongelado = null;
      }
    });
  }

  /**
   * Gera lista de anos disponíveis para o filtro (últimos 5 anos a partir do ano atual)
   */
  private gerarAnosDisponiveis(): void {
    const anoAtual = new Date().getFullYear();
    this.anosDisponiveis = [];
    for (let i = 0; i < 3; i++) {
      this.anosDisponiveis.push(anoAtual - i);
    }
  }

  /**
   * Callback quando usuário muda o filtro de ano
   */
  onAnoChange(): void {
    this.loadAllHistorico();
  }

  /**
   * Retorna texto formatado do período atual (mês/ano) para exibição no botão
   */
  getPeriodoMesAno(): string {
    const periodo = this.periodoAtual || this.periodoCongelado;
    if (!periodo) return '';
    const dataRef = new Date(periodo.dataReferencia);
    const mes = (dataRef.getMonth() + 1).toString().padStart(2, '0');
    const ano = dataRef.getFullYear();
    return `${mes}/${ano}`;
  }
}
