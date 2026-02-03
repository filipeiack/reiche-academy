import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import {
  AcaoCockpit,
  IndicadorCockpit,
  IndicadorMensal,
} from '@core/interfaces/cockpit-pilares.interface';
import { OFFCANVAS_SIZE } from '@core/constants/ui.constants';
import { AcaoFormDrawerComponent } from '@app/views/pages/cockpit-pilares/plano-acao-especifico/acao-form-drawer/acao-form-drawer.component';
import { TranslatePipe } from "../../../../core/pipes/translate.pipe";
import { formatDateInputSaoPaulo } from '@core/utils/date-time';

@Component({
  selector: 'app-plano-acao-especifico',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './plano-acao-especifico.component.html',
  styleUrl: './plano-acao-especifico.component.scss',
})

export class PlanoAcaoEspecificoComponent implements OnInit {
  @Input() cockpitId!: string;

  private cockpitService = inject(CockpitPilaresService);
  private offcanvasService = inject(NgbOffcanvas);

  indicadores: IndicadorCockpit[] = [];
  acoes: AcaoCockpit[] = [];
  resumoStatus: Array<{
    key: string;
    label: string;
    count: number;
    percent: number;
    badgeClass: string;
    icon: string;
    kpiClass: string;
  }> = [];
  empresaId: string | null = null;
  loading = false;

  ngOnInit(): void {
    this.loadCockpit();
  }

  private loadCockpit(): void {
    if (!this.cockpitId) return;
    this.loading = true;

    this.cockpitService.getCockpitById(this.cockpitId).subscribe({
      next: (cockpit) => {
        this.indicadores = cockpit.indicadores || [];
        this.empresaId = cockpit.pilarEmpresa?.empresaId || null;
        this.loadAcoes();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar cockpit:', err);
        this.loading = false;
      },
    });
  }

  private loadAcoes(): void {
    this.cockpitService.getAcoesCockpit(this.cockpitId).subscribe({
      next: (acoes) => {
        this.acoes = acoes;
        this.atualizarResumoStatus();
      },
      error: (err) => {
        console.error('Erro ao carregar ações:', err);
        this.acoes = [];
        this.atualizarResumoStatus();
      },
    });
  }

  abrirDrawerNovaAcao(): void {
    if (!this.empresaId) {
      this.showToast('Empresa não encontrada para este cockpit', 'error');
      return;
    }

    const offcanvasRef = this.offcanvasService.open(AcaoFormDrawerComponent, {
      position: 'end',
      backdrop: 'static',
      panelClass: `${OFFCANVAS_SIZE.MEDIUM} offcanvas-full-mobile`,
    });

    const component = offcanvasRef.componentInstance as AcaoFormDrawerComponent;
    component.cockpitId = this.cockpitId;
    component.empresaId = this.empresaId;
    component.indicadores = this.indicadores;
    component.acaoSalva.subscribe((acao: AcaoCockpit) => {
      this.acoes.unshift(acao);
      this.atualizarResumoStatus();
    });
  }

  editarAcao(acao: AcaoCockpit): void {
    if (!this.empresaId) {
      this.showToast('Empresa não encontrada para este cockpit', 'error');
      return;
    }

    const offcanvasRef = this.offcanvasService.open(AcaoFormDrawerComponent, {
      position: 'end',
      backdrop: 'static',
      panelClass: `${OFFCANVAS_SIZE.MEDIUM} offcanvas-full-mobile`,
    });

    const component = offcanvasRef.componentInstance as AcaoFormDrawerComponent;
    component.cockpitId = this.cockpitId;
    component.empresaId = this.empresaId;
    component.indicadores = this.indicadores;
    component.acaoParaEditar = acao;
    component.acaoSalva.subscribe((acaoAtualizada: AcaoCockpit) => {
      const index = this.acoes.findIndex((a) => a.id === acaoAtualizada.id);
      if (index >= 0) {
        this.acoes[index] = acaoAtualizada;
      }
      this.atualizarResumoStatus();
    });
  }

  async deleteAcao(acao: AcaoCockpit): Promise<void> {
    const result = await Swal.fire({
      title: 'Remover Ação',
      text: 'Deseja remover esta ação? Esta operação não pode ser desfeita.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    this.cockpitService.deleteAcaoCockpit(acao.id).subscribe({
      next: () => {
        this.acoes = this.acoes.filter((a) => a.id !== acao.id);
        this.atualizarResumoStatus();
        this.showToast('Ação removida com sucesso', 'success');
      },
      error: (err) => {
        console.error('Erro ao remover ação:', err);
        this.showToast(err?.error?.message || 'Erro ao remover ação', 'error');
      },
    });
  }

  getStatusLabel(acao: AcaoCockpit): string {
    switch (acao.statusCalculado) {
      case 'CONCLUIDA':
        return 'CONCLUÍDA';
      case 'ATRASADA':
        return 'ATRASADA';
      case 'EM_ANDAMENTO':
        return 'EM ANDAMENTO';
      case 'A_INICIAR':
        return 'A INICIAR';
      default:
        return 'A INICIAR';
    }
  }

  getStatusClass(acao: AcaoCockpit): string {
    switch (acao.statusCalculado) {
      case 'ATRASADA':
        return 'bg-danger';
      case 'CONCLUIDA':
        return 'bg-success';
      case 'EM_ANDAMENTO':
        return 'bg-warning';
      case 'A_INICIAR':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  marcarInicioReal(acao: AcaoCockpit): void {
    if (acao.inicioReal) {
      this.showToast('Início real já informado.', 'info');
      return;
    }

    const hoje = this.getHojeDateInput();
    this.atualizarDatasReais(acao.id, { inicioReal: hoje });
  }

  marcarTerminoReal(acao: AcaoCockpit): void {
    if (!acao.inicioReal) {
      this.showToast('Informe o início real antes de concluir.', 'error');
      return;
    }

    if (acao.dataConclusao) {
      this.showToast('Término real já informado.', 'info');
      return;
    }

    const hoje = this.getHojeDateInput();
    this.atualizarDatasReais(acao.id, { terminoReal: hoje });
  }

  private atualizarDatasReais(
    acaoId: string,
    payload: { inicioReal?: string; terminoReal?: string },
  ): void {
    this.cockpitService.updateAcaoCockpit(acaoId, payload).subscribe({
      next: (acaoAtualizada) => {
        const index = this.acoes.findIndex((a) => a.id === acaoAtualizada.id);
        if (index >= 0) {
          this.acoes[index] = acaoAtualizada;
        }
        this.atualizarResumoStatus();
        this.showToast('Datas atualizadas com sucesso', 'success');
      },
      error: (err) => {
        console.error('Erro ao atualizar datas reais:', err);
        this.showToast(err?.error?.message || 'Erro ao atualizar datas', 'error');
      },
    });
  }

  private atualizarResumoStatus(): void {
    const total = this.acoes.length;
    const base = [
      {
        key: 'A_INICIAR',
        label: 'A INICIAR',
        badgeClass: 'bg-secondary',
        icon: 'clock',
        kpiClass: 'kpi-neutral',
      },
      {
        key: 'EM_ANDAMENTO',
        label: 'EM ANDAMENTO',
        badgeClass: 'bg-warning',
        icon: 'activity',
        kpiClass: 'kpi-progress',
      },
      {
        key: 'ATRASADA',
        label: 'ATRASADA',
        badgeClass: 'bg-danger',
        icon: 'alert-triangle',
        kpiClass: 'kpi-danger',
      },
      {
        key: 'CONCLUIDA',
        label: 'CONCLUÍDA',
        badgeClass: 'bg-success',
        icon: 'check-circle',
        kpiClass: 'kpi-success',
      },
    ];

    this.resumoStatus = base.map((status) => {
      const count = this.acoes.filter(
        (acao) => (acao.statusCalculado || 'A_INICIAR') === status.key,
      ).length;
      const percent = total ? Math.round((count / total) * 100) : 0;
      return { ...status, count, percent };
    });
  }

  private getHojeDateInput(): string {
    return formatDateInputSaoPaulo(new Date());
  }

  getMesLabel(
    mes:
      | IndicadorMensal
      | { mes: number | null; ano: number }
      | null
      | undefined,
  ): string {
    if (!mes) return '-';
    const mesLabel = mes.mes ? mes.mes.toString().padStart(2, '0') : '--';
    return `${mesLabel}/${mes.ano}`;
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer = 3000): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      title,
      icon,
    });
  }
}
