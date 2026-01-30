import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { CreateUsuarioDto, UsersService } from '@core/services/users.service';
import { PerfisService } from '@core/services/perfis.service';
import {
  IndicadorCockpit,
  TipoMedidaIndicador,
  StatusMedicaoIndicador,
  DirecaoIndicador,
} from '@core/interfaces/cockpit-pilares.interface';
import { Usuario } from '@core/models/auth.model';
import { StatusMedicaoUtil } from '@core/utils/status-medicao.util';

@Component({
  selector: 'app-indicador-form-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  template: `
    <div class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title" data-testid="indicador-drawer-title">
          <i class="bi bi-bar-chart me-2"></i>
          {{ isEditMode ? 'Editar Indicador' : 'Novo Indicador' }}
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto small">
        <form [formGroup]="form">
        <!-- Nome -->
        <div class="mb-3">
          <label class="form-label">
            Nome do Indicador <span class="text-danger">*</span>
          </label>
          <input
            type="text"
            class="form-control"
            formControlName="nome"
            data-testid="indicador-nome-input"
            placeholder="Ex: Ticket médio de vendas"
            [class.is-invalid]="form.get('nome')?.invalid && form.get('nome')?.touched"
          />
          @if (form.get('nome')?.invalid && form.get('nome')?.touched) {
          <div class="invalid-feedback d-block">Nome é obrigatório</div>
          }
        </div>

        <!-- Tipo de Medida -->
        <div class="mb-3">
          <label class="form-label">
            Tipo de Medida <span class="text-danger">*</span>
          </label>
          <select
            class="form-select"
            formControlName="tipoMedida"
            data-testid="indicador-tipo-select"
            [class.is-invalid]="form.get('tipoMedida')?.invalid && form.get('tipoMedida')?.touched"
          >
            <option [value]="null">Selecione...</option>
            @for (tipo of tiposMedida; track tipo.value) {
            <option [value]="tipo.value">{{ tipo.label }}</option>
            }
          </select>
          @if (form.get('tipoMedida')?.invalid && form.get('tipoMedida')?.touched) {
          <div class="invalid-feedback d-block">Tipo de medida é obrigatório</div>
          }
        </div>

        <!-- Status de Medição -->
        <div class="mb-3">
          <label class="form-label">Status de Medição</label>
          <select class="form-select" formControlName="statusMedicao" data-testid="indicador-status-select">
            @for (status of statusMedicao; track status.value) {
            <option [value]="status.value">{{ status.label }}</option>
            }
          </select>
        </div>

        <!-- Responsável -->
        <div class="mb-3">
          <label class="form-label">Responsável pela Medição</label>
          <ng-select
            formControlName="responsavelMedicaoId"
            [items]="usuarios"
            bindLabel="nome"
            bindValue="id"
            placeholder="Selecione um responsável..."
            [searchable]="true"
            [addTag]="addUsuarioTag"
            [clearable]="true"
            appendTo="body"
          >
          </ng-select>
        </div>

        <!-- Melhor (Direção) -->
        <div class="mb-3">
          <label class="form-label">
            Melhor Resultado <span class="text-danger">*</span>
          </label>
          <div class="btn-group w-100" role="group">
            <input
              type="radio"
              class="btn-check"
              formControlName="melhor"
              [value]="DirecaoIndicador.MAIOR"
              id="melhor-maior"
            />
            <label class="btn btn-outline-secondary" for="melhor-maior" data-testid="indicador-melhor-maior">
              <i class="bi bi-arrow-up me-1"></i>
              Maior é melhor
            </label>

            <input
              type="radio"
              class="btn-check"
              formControlName="melhor"
              [value]="DirecaoIndicador.MENOR"
              id="melhor-menor"
            />
            <label class="btn btn-outline-secondary" for="melhor-menor" data-testid="indicador-melhor-menor">
              <i class="bi bi-arrow-down me-1"></i>
              Menor é melhor
            </label>
          </div>
        </div>

        <!-- Descrição -->
        <div class="mb-3">
          <label class="form-label">Descrição / Observações</label>
          <textarea
            class="form-control"
            formControlName="descricao"
            data-testid="indicador-descricao-textarea"
            rows="4"
            placeholder="Informações adicionais sobre este indicador..."
          ></textarea>
          <small class="text-muted">Opcional</small>
        </div>
      </form>
    </div>

    <div class="offcanvas-footer border-top p-3 flex-shrink-0 bg-light">
      <div class="d-flex gap-2 justify-content-end">
        <button type="button" class="btn btn-secondary" (click)="fechar()" data-testid="indicador-cancel">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-primary"
          (click)="salvar()"
          data-testid="indicador-submit"
          [disabled]="form.invalid || saving"
        >
          @if (saving) {
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
          }
          {{ isEditMode ? 'Atualizar' : 'Criar Indicador' }}
        </button>
      </div>
    </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .offcanvas-footer {
        background-color: var(--bs-body-bg);
    }
  `]
})
export class IndicadorFormDrawerComponent implements OnInit {
  private fb = inject(FormBuilder);
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private cockpitService = inject(CockpitPilaresService);
  private usersService = inject(UsersService);
  private perfisService = inject(PerfisService);

  @Input() cockpitId!: string;
  @Input() empresaId!: string;
  @Input() usuarios: Usuario[] = [];
  @Input() set indicadorParaEditar(value: IndicadorCockpit | undefined) {
    if (value) {
      this.isEditMode = true;
      this.indicadorId = value.id;
      this.form.patchValue({
        nome: value.nome,
        tipoMedida: value.tipoMedida,
        statusMedicao: value.statusMedicao,
        responsavelMedicaoId: value.responsavelMedicaoId,
        melhor: value.melhor,
        descricao: value.descricao || ''
      });
    }
  }
  @Output() indicadorSalvo = new EventEmitter<IndicadorCockpit>();

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    tipoMedida: [null as TipoMedidaIndicador | null, Validators.required],
    statusMedicao: [StatusMedicaoIndicador.NAO_MEDIDO],
    responsavelMedicaoId: [null as string | null],
    melhor: [DirecaoIndicador.MAIOR, Validators.required],
    descricao: ['']
  });

  saving = false;
  isEditMode = false;
  indicadorId: string | null = null;
  private perfilColaboradorId: string | null = null;

  // Enums para template
  tiposMedida = [
    { value: TipoMedidaIndicador.REAL, label: 'R$ (Reais)' },
    { value: TipoMedidaIndicador.QUANTIDADE, label: 'Quantidade' },
    { value: TipoMedidaIndicador.TEMPO, label: 'Tempo' },
    { value: TipoMedidaIndicador.PERCENTUAL, label: '% (Percentual)' },
  ];

  statusMedicao = StatusMedicaoUtil.getAllOptions();
  DirecaoIndicador = DirecaoIndicador;

  ngOnInit(): void {
    this.carregarPerfilColaborador();
  }

  private carregarPerfilColaborador(): void {
    this.perfisService.findAll().subscribe({
      next: (perfis) => {
        const perfilColab = perfis.find(p => p.codigo === 'COLABORADOR');
        if (perfilColab) {
          this.perfilColaboradorId = perfilColab.id;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar perfis:', err);
      }
    });
  }

  addUsuarioTag = (nome: string): Usuario | Promise<Usuario> => {
    if (!this.perfilColaboradorId) {
      this.showToast('Perfil COLABORADOR não foi carregado', 'error');
      return Promise.reject('Perfil COLABORADOR não disponível');
    }

    const nomeParts = nome.trim().split(/\s+/);
    if (nomeParts.length < 2) {
      this.showToast('Por favor, informe nome e sobrenome', 'error');
      return Promise.reject('Nome e sobrenome são obrigatórios');
    }

    const novoUsuario: CreateUsuarioDto = {
      nome: nome,
      empresaId: this.empresaId,
      perfilId: this.perfilColaboradorId
    };

    return new Promise((resolve, reject) => {
      this.usersService.create(novoUsuario).subscribe({
        next: (usuario) => {
          this.showToast(`Usuário "${nome}" criado com sucesso!`, 'success');
          this.usuarios.push(usuario);
          resolve(usuario);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao criar usuário', 'error');
          reject(err);
        }
      });
    });
  };

  fechar(): void {
    this.activeOffcanvas.dismiss();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.form.value;

    if (this.isEditMode && this.indicadorId) {
      // UPDATE
      this.cockpitService.updateIndicador(this.indicadorId, formValue as any).subscribe({
        next: (updated) => {
          this.showToast('Indicador atualizado com sucesso!', 'success');
          this.indicadorSalvo.emit(updated);
          this.saving = false;
          this.fechar();
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao atualizar indicador', 'error');
          this.saving = false;
        }
      });
    } else {
      // CREATE
      this.cockpitService.createIndicador(this.cockpitId, formValue as any).subscribe({
        next: (created) => {
          this.showToast('Indicador criado com sucesso!', 'success');
          this.indicadorSalvo.emit(created);
          this.saving = false;
          this.form.reset({
            statusMedicao: StatusMedicaoIndicador.NAO_MEDIDO,
            melhor: DirecaoIndicador.MAIOR,
            descricao: ''
          });
          // Mantém drawer aberto para criar outro
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao criar indicador', 'error');
          this.saving = false;
        }
      });
    }
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
