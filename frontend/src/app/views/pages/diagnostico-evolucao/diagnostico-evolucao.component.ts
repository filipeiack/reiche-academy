import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import Swal from 'sweetalert2';
import { DiagnosticoNotasService, MediaPilar, HistoricoEvolucao } from '../../../core/services/diagnostico-notas.service';
import { EmpresasService, Empresa } from '../../../core/services/empresas.service';
import { AuthService, EmpresaBasic } from '../../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
  selectedPilarEmpresaId: string | null = null;
  historico: HistoricoEvolucao[] = [];
  chart: Chart | null = null;

  canCongelar = false; // ADMINISTRADOR, CONSULTOR, GESTOR

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
        estado: user.empresa?.estado || '',
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
            // Recarregar histórico se houver pilar selecionado
            if (this.selectedPilarEmpresaId) {
              this.loadHistorico(this.selectedPilarEmpresaId);
            }
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

  onPilarChange(pilarEmpresaId: string): void {
    if (!pilarEmpresaId) {
      this.destroyChart();
      this.historico = [];
      return;
    }

    this.selectedPilarEmpresaId = pilarEmpresaId;
    this.loadHistorico(pilarEmpresaId);
  }

  private loadHistorico(pilarEmpresaId: string): void {
    if (!this.selectedEmpresaId) return;

    this.diagnosticoService.buscarHistoricoEvolucao(this.selectedEmpresaId, pilarEmpresaId).subscribe({
      next: (data) => {
        this.historico = data;
        this.renderChart();
      },
      error: (err: any) => {
        this.showToast('Erro ao carregar histórico', 'error');
        this.historico = [];
        this.destroyChart();
      }
    });
  }

  private renderChart(): void {
    this.destroyChart();

    if (this.historico.length === 0) {
      return;
    }

    const ctx = document.getElementById('evolucaoChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.historico.map(h => new Date(h.createdAt).toLocaleDateString('pt-BR'));
    const data = this.historico.map(h => h.mediaNotas);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Média das Notas',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Média: ' + context.parsed.y.toFixed(2);
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
