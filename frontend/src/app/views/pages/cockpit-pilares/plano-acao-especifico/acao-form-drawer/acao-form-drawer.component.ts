import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
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
  selector: 'app-acao-form-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  template: `
    <form [formGroup]="form" class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title">
          <i class="bi bi-clipboard-check me-2"></i>
          {{ isEditMode ? 'Editar Plano de Ação' : 'Adicionar Plano de Ação' }}
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto">
        <!-- <div class="alert alert-info mb-3">
          <i class="bi bi-bar-chart me-1"></i>
          <strong>Plano de Ação</strong>
        </div> -->
        <div class="row g-2">
          <div class="col-md-12">
            <label class="form-label">Indicador</label>
            <ng-select
              class="ng-select-indicador"
              formControlName="indicadorId"
              [items]="indicadores"
              bindLabel="nome"
              bindValue="id"
              placeholder="Selecione um indicador..."
            >
              <ng-template ng-label-tmp let-item="item">
                <div class="d-flex flex-column">
                  <span class="fw-bold">{{ item?.nome }}</span>
                  @if (item?.descricao) {
                  <small class="text-muted">{{ item?.descricao }}</small>
                  }
                </div>
              </ng-template>
              <ng-template ng-option-tmp let-item="item">
                <div class="d-flex flex-column">
                  <span>{{ item?.nome }}</span>
                  @if (item?.descricao) {
                  <small class="text-muted">{{ item?.descricao }}</small>
                  }
                </div>
              </ng-template>
            </ng-select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Mês de Análise</label>
            <ng-select
              formControlName="indicadorMensalId"
              [items]="mesesDisponiveis"
              bindLabel="id"
              bindValue="id"
              placeholder="Selecione o mês..."
            >
              <ng-template ng-option-tmp let-item="item">
                {{ getMesLabel(item) }}
              </ng-template>
              <ng-template ng-label-tmp let-item="item">
                {{ getMesLabel(item) }}
              </ng-template>
            </ng-select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Status</label>
            <select class="form-select" formControlName="status">
              @for (status of statusOptions; track status.value) {
                <option [value]="status.value">{{ status.label }}</option>
              }
            </select>
          </div>
          
          <div class="col-md-12">
            <label class="form-label">Causas (5 Porquês)</label>
            <div class="row g-2">
              <div class="col-md-12">
                <input class="form-control" placeholder="1º porquê" formControlName="causa1" />
              </div>
              <div class="col-md-12">
                <input class="form-control" placeholder="2º porquê" formControlName="causa2" />
              </div>
              <div class="col-md-12">
                <input class="form-control" placeholder="3º porquê" formControlName="causa3" />
              </div>
              <div class="col-md-12">
                <input class="form-control" placeholder="4º porquê" formControlName="causa4" />
              </div>
              <div class="col-md-12">
                <input class="form-control" placeholder="5º porquê" formControlName="causa5" />
              </div>
            </div>
          </div>

          <div class="col-md-12">
            <label class="form-label">Responsável</label>
            <ng-select
              formControlName="responsavelId"
              [items]="usuarios"
              bindLabel="nome"
              bindValue="id"
              placeholder="Selecione um responsável..."
              [addTag]="addUsuarioTag"
              [clearable]="true"
            ></ng-select>
          </div>
          
          <div class="col-md-6">
            <label class="form-label">Prazo</label>
            <input type="date" class="form-control" formControlName="prazo" />
          </div>

          <div class="col-md-6">
            <label class="form-label">Data de Conclusão</label>
            <input type="date" class="form-control" formControlName="dataConclusao" />
          </div>

          <div class="col-md-12">
            <label class="form-label">Ação Proposta</label>
            <textarea class="form-control" rows="2" formControlName="acaoProposta" maxlength="500"></textarea>
          </div>

          
          
        </div>
      </div>

      <div class="offcanvas-footer border-top p-3 flex-shrink-0 bg-light">
        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-secondary" (click)="fechar()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="salvar()"
            [disabled]="form.invalid || saving"
          >
            @if (saving) {
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            }
            {{ isEditMode ? 'Atualizar Ação' : 'Adicionar Ação' }}
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .offcanvas-footer {
        background-color: var(--bs-body-bg);
      }
      ::ng-deep ng-select.ng-select-indicador .ng-select-container {
        min-height: 56px;
        height: auto;
        align-items: flex-start;
        padding-top: 6px;
        padding-bottom: 6px;
      }
    `,
  ],
})
export class AcaoFormDrawerComponent implements OnInit {
  private fb = inject(FormBuilder);
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private cockpitService = inject(CockpitPilaresService);
  private usersService = inject(UsersService);
  private perfisService = inject(PerfisService);

  @Input() cockpitId!: string;
  @Input() empresaId!: string;
  @Input() indicadores: IndicadorCockpit[] = [];
  @Input() set acaoParaEditar(value: AcaoCockpit | undefined) {
    if (value) {
      this.isEditMode = true;
      this.acaoId = value.id;
      const indicadorId = value.indicadorCockpitId || null;
      const indicadorMensalId = value.indicadorMensalId || null;
      this.form.patchValue({
        indicadorId,
        indicadorMensalId,
        causa1: value.causa1 || '',
        causa2: value.causa2 || '',
        causa3: value.causa3 || '',
        causa4: value.causa4 || '',
        causa5: value.causa5 || '',
        acaoProposta: value.acaoProposta || '',
        responsavelId: value.responsavelId || null,
        status: value.status,
        prazo: value.prazo ? this.toDateInput(value.prazo) : null,
        dataConclusao: value.dataConclusao ? this.toDateInput(value.dataConclusao) : null,
      });
      this.onIndicadorChange(indicadorId, true);
      this.form.patchValue({ indicadorMensalId });
    }
  }
  @Output() acaoSalva = new EventEmitter<AcaoCockpit>();

  usuarios: Usuario[] = [];
  mesesDisponiveis: IndicadorMensal[] = [];
  saving = false;
  isEditMode = false;
  acaoId: string | null = null;
  private perfilColaboradorId: string | null = null;

  statusOptions = [
    { value: StatusAcao.PENDENTE, label: 'A INICIAR' },
    { value: StatusAcao.EM_ANDAMENTO, label: 'EM ANDAMENTO' },
    { value: StatusAcao.CONCLUIDA, label: 'CONCLUÍDA' },
  ];

  form = this.fb.group({
    indicadorId: [null as string | null, Validators.required],
    indicadorMensalId: [null as string | null, Validators.required],
    causa1: [''],
    causa2: [''],
    causa3: [''],
    causa4: [''],
    causa5: [''],
    acaoProposta: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
    responsavelId: [null as string | null],
    status: [StatusAcao.PENDENTE],
    prazo: [null as string | null, Validators.required],
    dataConclusao: [null as string | null],
  });

  ngOnInit(): void {
    this.carregarPerfilColaborador();
    this.loadUsuariosDaEmpresa();
    this.form.get('indicadorId')?.valueChanges.subscribe((valor) => {
      this.onIndicadorChange(valor);
    });
  }

  fechar(): void {
    this.activeOffcanvas.dismiss();
  }

  onIndicadorChange(indicadorId: string | null, keepSelection = false): void {
    const indicador = this.indicadores.find((i) => i.id === indicadorId);
    this.mesesDisponiveis = indicador?.mesesIndicador || [];
    if (!keepSelection) {
      this.form.patchValue({ indicadorMensalId: null });
    }
  }

  salvar(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const normalizeCausa = (value: string | null | undefined) => {
      if (value === undefined || value === null) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const dto = {
      indicadorMensalId: this.form.value.indicadorMensalId!,
      causa1: normalizeCausa(this.form.value.causa1),
      causa2: normalizeCausa(this.form.value.causa2),
      causa3: normalizeCausa(this.form.value.causa3),
      causa4: normalizeCausa(this.form.value.causa4),
      causa5: normalizeCausa(this.form.value.causa5),
      acaoProposta: this.form.value.acaoProposta?.trim() || '',
      responsavelId: this.form.value.responsavelId || null,
      status: this.form.value.status || StatusAcao.PENDENTE,
      prazo: this.form.value.prazo!,
      dataConclusao: this.form.value.dataConclusao || null,
    };

    const request$ = this.isEditMode && this.acaoId
      ? this.cockpitService.updateAcaoCockpit(this.acaoId, dto)
      : this.cockpitService.createAcaoCockpit(this.cockpitId, dto);

    request$.subscribe({
      next: (acao) => {
        this.acaoSalva.emit(acao);
        this.saving = false;
        this.activeOffcanvas.close();
      },
      error: (err) => {
        console.error('Erro ao salvar ação:', err);
        this.saving = false;
        this.showToast('Erro ao salvar ação', 'error');
      },
    });
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

  private toDateInput(value: string): string {
    if (!value) return '';
    return value.split('T')[0];
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
