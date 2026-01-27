import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { CreateUsuarioDto, UsersService } from '@core/services/users.service';
import { PerfisService } from '@core/services/perfis.service';
import {
  AcaoCockpit,
  IndicadorCockpit,
  IndicadorMensal,
  StatusAcao,
} from '@core/interfaces/cockpit-pilares.interface';
import { Usuario } from '@core/models/auth.model';

@Component({
  selector: 'app-plano-acao-especifico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './plano-acao-especifico.component.html',
  styleUrl: './plano-acao-especifico.component.scss',
})
export class PlanoAcaoEspecificoComponent implements OnInit {
  @Input() cockpitId!: string;

  private fb = inject(FormBuilder);
  private cockpitService = inject(CockpitPilaresService);
  private usersService = inject(UsersService);
  private perfisService = inject(PerfisService);

  indicadores: IndicadorCockpit[] = [];
  mesesDisponiveis: IndicadorMensal[] = [];
  acoes: AcaoCockpit[] = [];
  usuarios: Usuario[] = [];
  empresaId: string | null = null;
  loading = false;
  saving = false;
  editandoAcaoId: string | null = null;
  private perfilColaboradorId: string | null = null;

  statusOptions = [
    { value: StatusAcao.PENDENTE, label: 'A INICIAR' },
    { value: StatusAcao.EM_ANDAMENTO, label: 'EM ANDAMENTO' },
    { value: StatusAcao.CONCLUIDA, label: 'CONCLUÍDA' },
  ];

  form = this.fb.group({
    indicadorId: [null as string | null, Validators.required],
    indicadorMensalId: [null as string | null, Validators.required],
    causa1: ['', [Validators.required, Validators.minLength(3)]],
    causa2: ['', [Validators.required, Validators.minLength(3)]],
    causa3: ['', [Validators.required, Validators.minLength(3)]],
    causa4: ['', [Validators.required, Validators.minLength(3)]],
    causa5: ['', [Validators.required, Validators.minLength(3)]],
    acaoProposta: ['', [Validators.required, Validators.minLength(3)]],
    responsavelId: [null as string | null],
    status: [StatusAcao.PENDENTE],
    prazo: [null as string | null],
  });

  ngOnInit(): void {
    this.carregarPerfilColaborador();
    this.loadCockpit();
    this.form.get('indicadorId')?.valueChanges.subscribe((valor) => {
      this.onIndicadorChange(valor);
    });
  }

  private loadCockpit(): void {
    if (!this.cockpitId) return;
    this.loading = true;

    this.cockpitService.getCockpitById(this.cockpitId).subscribe({
      next: (cockpit) => {
        this.indicadores = cockpit.indicadores || [];
        this.empresaId = cockpit.pilarEmpresa?.empresaId || null;
        this.loadUsuariosDaEmpresa();
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
      },
      error: (err) => {
        console.error('Erro ao carregar ações:', err);
        this.acoes = [];
      },
    });
  }

  onIndicadorChange(indicadorId: string | null): void {
    const indicador = this.indicadores.find((i) => i.id === indicadorId);
    this.mesesDisponiveis = indicador?.mesesIndicador || [];
    this.form.patchValue({ indicadorMensalId: null });
  }

  salvar(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const dto = {
      indicadorMensalId: this.form.value.indicadorMensalId!,
      causa1: this.form.value.causa1 || '',
      causa2: this.form.value.causa2 || '',
      causa3: this.form.value.causa3 || '',
      causa4: this.form.value.causa4 || '',
      causa5: this.form.value.causa5 || '',
      acaoProposta: this.form.value.acaoProposta || '',
      responsavelId: this.form.value.responsavelId || null,
      status: this.form.value.status || StatusAcao.PENDENTE,
      prazo: this.form.value.prazo || null,
    };

    const request$ = this.editandoAcaoId
      ? this.cockpitService.updateAcaoCockpit(this.editandoAcaoId, dto)
      : this.cockpitService.createAcaoCockpit(this.cockpitId, dto);

    request$.subscribe({
      next: (acao) => {
        if (this.editandoAcaoId) {
          const index = this.acoes.findIndex((a) => a.id === acao.id);
          if (index >= 0) {
            this.acoes[index] = acao;
          }
        } else {
          this.acoes.unshift(acao);
        }
        this.resetForm();
        this.saving = false;
        this.showToast('Ação salva com sucesso', 'success');
      },
      error: (err) => {
        console.error('Erro ao salvar ação:', err);
        this.saving = false;
        this.showToast('Erro ao salvar ação', 'error');
      },
    });
  }

  editarAcao(acao: AcaoCockpit): void {
    this.editandoAcaoId = acao.id;
    const indicadorId = acao.indicadorCockpitId || null;
    this.form.patchValue({
      indicadorId,
      indicadorMensalId: acao.indicadorMensalId || null,
      causa1: acao.causa1 || '',
      causa2: acao.causa2 || '',
      causa3: acao.causa3 || '',
      causa4: acao.causa4 || '',
      causa5: acao.causa5 || '',
      acaoProposta: acao.acaoProposta || '',
      responsavelId: acao.responsavelId || null,
      status: acao.status,
      prazo: acao.prazo || null,
    });

    this.onIndicadorChange(indicadorId);
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
        this.showToast('Ação removida com sucesso', 'success');
      },
      error: (err) => {
        console.error('Erro ao remover ação:', err);
        this.showToast('Erro ao remover ação', 'error');
      },
    });
  }

  cancelarEdicao(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editandoAcaoId = null;
    this.form.reset({
      indicadorId: null,
      indicadorMensalId: null,
      causa1: '',
      causa2: '',
      causa3: '',
      causa4: '',
      causa5: '',
      acaoProposta: '',
      responsavelId: null,
      status: StatusAcao.PENDENTE,
      prazo: null,
    });
    this.mesesDisponiveis = [];
  }

  getStatusLabel(acao: AcaoCockpit): string {
    if (acao.statusCalculado === 'ATRASADA') return 'ATRASADA';
    switch (acao.status) {
      case StatusAcao.PENDENTE:
        return 'A INICIAR';
      case StatusAcao.EM_ANDAMENTO:
        return 'EM ANDAMENTO';
      case StatusAcao.CONCLUIDA:
        return 'CONCLUÍDA';
      case StatusAcao.CANCELADA:
        return 'CANCELADA';
      default:
        return 'A INICIAR';
    }
  }

  getStatusClass(acao: AcaoCockpit): string {
    const status = acao.statusCalculado === 'ATRASADA' ? 'ATRASADA' : acao.status;
    switch (status) {
      case 'ATRASADA':
        return 'bg-danger';
      case StatusAcao.EM_ANDAMENTO:
        return 'bg-warning text-dark';
      case StatusAcao.CONCLUIDA:
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
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

  getAcoesFiltradas(): AcaoCockpit[] {
    const indicadorId = this.form.value.indicadorId;
    const indicadorMensalId = this.form.value.indicadorMensalId;

    return this.acoes.filter((acao) => {
      if (indicadorId && acao.indicadorCockpitId !== indicadorId) return false;
      if (indicadorMensalId && acao.indicadorMensalId !== indicadorMensalId) return false;
      return true;
    });
  }

  private carregarPerfilColaborador(): void {
    this.perfisService.findAll().subscribe({
      next: (perfis) => {
        const perfilColab = perfis.find((p) => p.codigo === 'COLABORADOR');
        if (perfilColab) {
          this.perfilColaboradorId = perfilColab.id;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar perfis:', err);
      },
    });
  }

  private loadUsuariosDaEmpresa(): void {
    if (!this.empresaId) return;

    this.usersService.getAll().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios.filter((u) => u.empresaId === this.empresaId && u.ativo);
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
      },
    });
  }

  addUsuarioTag = (nome: string): Usuario | Promise<Usuario> => {
    if (!this.perfilColaboradorId) {
      this.showToast('Perfil COLABORADOR não foi carregado. Tente novamente.', 'error');
      return Promise.reject('Perfil COLABORADOR não disponível');
    }

    const nomeParts = nome.trim().split(/\s+/);
    if (nomeParts.length < 2) {
      this.showToast('Por favor, informe nome e sobrenome', 'error');
      return Promise.reject('Nome e sobrenome são obrigatórios');
    }

    const novoUsuario: CreateUsuarioDto = {
      nome,
      empresaId: this.empresaId || '',
      perfilId: this.perfilColaboradorId,
    };

    return new Promise((resolve, reject) => {
      this.usersService.create(novoUsuario).subscribe({
        next: (usuario) => {
          this.showToast(`Usuário "${nome}" criado com sucesso!`, 'success');
          this.usuarios.push(usuario);
          this.form.patchValue({ responsavelId: usuario.id });
          resolve(usuario);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao criar usuário', 'error');
          reject(err);
        },
      });
    });
  };

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
