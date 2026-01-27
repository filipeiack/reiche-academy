import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { CreateUsuarioDto, UsersService } from '@core/services/users.service';
import { PerfisService } from '@core/services/perfis.service';
import { CargoCockpit } from '@core/interfaces/cockpit-pilares.interface';
import { Usuario } from '@core/models/auth.model';

@Component({
  selector: 'app-cargo-form-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  template: `
    <div class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title">
          <i class="bi bi-people me-2"></i>
          {{ isEditMode ? 'Editar Cargo' : 'Novo Cargo' }}
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto small">
        <form [formGroup]="form">
          <div class="mb-3">
            <label class="form-label">
              Nome do Cargo <span class="text-danger">*</span>
            </label>
            <input
              type="text"
              class="form-control"
              formControlName="cargo"
              placeholder="Ex: Coordenador Comercial"
              [class.is-invalid]="form.get('cargo')?.invalid && form.get('cargo')?.touched"
            />
            @if (form.get('cargo')?.invalid && form.get('cargo')?.touched) {
              <div class="invalid-feedback d-block">Nome é obrigatório</div>
            }
          </div>

          <div class="mb-3">
            <label class="form-label">Responsáveis</label>
            <ng-select
              formControlName="responsavelIds"
              [items]="usuarios"
              bindLabel="nome"
              bindValue="id"
              [multiple]="true"
              placeholder="Selecione responsáveis..."
              [addTag]="addUsuarioTag"
              [clearable]="true"
              appendTo="body"
            >
            </ng-select>
          </div>
        </form>
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
            {{ isEditMode ? 'Atualizar' : 'Criar Cargo' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .offcanvas-footer {
        background-color: #f8f9fa;
      }
    `,
  ],
})
export class CargoFormDrawerComponent implements OnInit {
  private fb = inject(FormBuilder);
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private cockpitService = inject(CockpitPilaresService);
  private usersService = inject(UsersService);
  private perfisService = inject(PerfisService);

  @Input() cockpitId!: string;
  @Input() empresaId!: string;
  @Input() set cargoParaEditar(value: CargoCockpit | undefined) {
    if (value) {
      this.isEditMode = true;
      this.cargoId = value.id;
      this.form.patchValue({
        cargo: value.cargo,
        responsavelIds: value.responsaveis?.map((r) => r.usuarioId) || [],
      });
    }
  }
  @Output() cargoSalvo = new EventEmitter<CargoCockpit>();

  usuarios: Usuario[] = [];
  saving = false;
  isEditMode = false;
  cargoId: string | null = null;
  private perfilColaboradorId: string | null = null;

  form = this.fb.group({
    cargo: ['', [Validators.required, Validators.minLength(2)]],
    responsavelIds: [[] as string[]],
  });

  ngOnInit(): void {
    this.carregarPerfilColaborador();
    this.loadUsuariosDaEmpresa();
  }

  fechar(): void {
    this.activeOffcanvas.dismiss();
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
      empresaId: this.empresaId,
      perfilId: this.perfilColaboradorId,
    };

    return new Promise((resolve, reject) => {
      this.usersService.create(novoUsuario).subscribe({
        next: (usuario) => {
          this.showToast(`Usuário "${nome}" criado com sucesso!`, 'success');
          this.usuarios.push(usuario);
          const responsaveis = this.form.get('responsavelIds')?.value || [];
          this.form.patchValue({ responsavelIds: [...responsaveis, usuario.id] });
          resolve(usuario);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao criar usuário', 'error');
          reject(err);
        },
      });
    });
  };

  salvar(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const dto = {
      cargo: this.form.value.cargo || '',
      responsavelIds: this.form.value.responsavelIds || [],
    };

    const request$ = this.isEditMode && this.cargoId
      ? this.cockpitService.updateCargo(this.cargoId, dto)
      : this.cockpitService.createCargo(this.cockpitId, dto);

    request$.subscribe({
      next: (cargo) => {
        this.cargoSalvo.emit(cargo);
        this.saving = false;
        this.activeOffcanvas.close();
      },
      error: (err) => {
        console.error('Erro ao salvar cargo:', err);
        this.showToast('Erro ao salvar cargo', 'error');
        this.saving = false;
      },
    });
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
