import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
import { PilaresService, Pilar } from '@core/services/pilares.service';
import { PilaresEmpresaService } from '@core/services/pilares-empresa.service';

@Component({
  selector: 'app-pilar-add-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, FormsModule],
  template: `
    <div class="d-flex flex-column h-100">
      <div class="offcanvas-header border-bottom flex-shrink-0">
        <h5 class="offcanvas-title">
          <i class="feather icon-plus me-2"></i>
          Adicionar Pilar Customizado
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto">
        <form [formGroup]="form">
          <!-- Nome do Pilar -->
          <div class="mb-3">
            <label class="form-label">
              Nome do Pilar <span class="text-danger">*</span>
            </label>
            @if (loadingPilares) {
              <div class="text-center py-3">
                <div class="spinner-border text-primary spinner-border-sm" role="status">
                  <span class="visually-hidden">Carregando pilares...</span>
                </div>
              </div>
            } @else {
              <ng-select 
                [items]="pilaresDisponiveis" 
                bindLabel="nome" 
                bindValue="id"
                [(ngModel)]="pilarIdSelecionado"
                [ngModelOptions]="{standalone: true}"
                placeholder="Busque por nome ou digite para criar novo pilar..."
                [clearable]="true"
                [addTag]="addPilarTag"
                (change)="onPilarSelected()">
                <ng-template ng-option-tmp let-item="item">
                  <div class="d-flex align-items-center">
                    <i class="feather icon-layers me-2"></i>
                    <div>
                      <div>{{ item.nome }}</div>
                      @if (item.descricao) {
                        <small class="text-muted">{{ item.descricao }}</small>
                      }
                    </div>
                  </div>
                </ng-template>
              </ng-select>
            }
            @if (form.get('nome')?.invalid && form.get('nome')?.touched) {
              <div class="invalid-feedback d-block">Nome é obrigatório (mínimo 2 caracteres)</div>
            }
          </div>

          <div class="alert alert-info">
            <i class="feather icon-info me-2"></i>
            <small>
              Este drawer permanecerá aberto para adicionar múltiplos pilares rapidamente.
            </small>
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
            [disabled]="saving"
          >
            @if (saving) {
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            }
            Adicionar Pilar
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
export class PilarAddDrawerComponent implements OnInit {
  private fb = inject(FormBuilder);
  public activeOffcanvas = inject(NgbActiveOffcanvas);
  private pilaresService = inject(PilaresService);
  private pilaresEmpresaService = inject(PilaresEmpresaService);

  @Input() empresaId!: string;
  @Input() pilaresJaAssociados: string[] = [];
  @Output() pilarAdicionado = new EventEmitter<void>();

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]]
  });

  pilaresDisponiveis: Pilar[] = [];
  pilarIdSelecionado: string | null = null;
  loadingPilares = false;
  saving = false;
  private pilaresCustomizados = new Set<string>();
  private pilaresOriginaisIds = new Set<string>();

  ngOnInit(): void {
    this.loadPilaresDisponiveis();
  }

  fechar(): void {
    this.activeOffcanvas.dismiss();
  }

  loadPilaresDisponiveis(): void {
    this.loadingPilares = true;
    this.pilaresService.findAll().subscribe({
      next: (pilares) => {
        // Carregar TODOS os pilares ativos (validação de duplicação será feita ao salvar)
        this.pilaresDisponiveis = pilares.filter(p => p.ativo);
        this.pilaresOriginaisIds = new Set(this.pilaresDisponiveis.map(p => p.id));
        this.loadingPilares = false;
      },
      error: (err) => {
        console.error('Erro ao carregar pilares:', err);
        this.loadingPilares = false;
        this.showToast(err?.error?.message || 'Erro ao carregar pilares', 'error');
      }
    });
  }

  addPilarTag = (nome: string): Pilar | Promise<Pilar> => {
    if (nome.length > 60) {
      this.showToast('O nome do pilar deve ter no máximo 60 caracteres', 'error');
      return Promise.reject('Nome muito longo');
    }

    if (nome.length < 2) {
      this.showToast('O nome do pilar deve ter no mínimo 2 caracteres', 'error');
      return Promise.reject('Nome muito curto');
    }

    this.pilaresCustomizados.add(nome);
    
    const pilarFake: Pilar = {
      id: nome,
      nome: nome,
      descricao: '(novo)',
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.pilarIdSelecionado = nome;
    return Promise.resolve(pilarFake);
  };

  onPilarSelected(): void {
    // Pode ser usada para lógica adicional se necessário
  }

  salvar(): void {
    if (!this.pilarIdSelecionado) {
      this.showToast('Selecione ou digite o nome de um pilar', 'warning');
      return;
    }

    if (!this.empresaId) {
      this.showToast('Empresa não identificada', 'error');
      return;
    }

    const isCustomizado = this.pilaresCustomizados.has(this.pilarIdSelecionado) || 
                          !this.pilaresOriginaisIds.has(this.pilarIdSelecionado);

    // Verificar se o pilar template já está vinculado (antes de salvar)
    if (!isCustomizado && this.pilaresJaAssociados.includes(this.pilarIdSelecionado)) {
      const pilarNome = this.pilaresDisponiveis.find(p => p.id === this.pilarIdSelecionado)?.nome || 'Este pilar';
      this.showToast(`${pilarNome} já está vinculado a esta empresa`, 'warning');
      return;
    }

    this.saving = true;

    if (isCustomizado) {
      this.pilaresEmpresaService.criarPilarCustomizado(this.empresaId, { nome: this.pilarIdSelecionado }).subscribe({
        next: (pilar) => {
          this.showToast(`Pilar "${pilar.nome}" criado com sucesso!`, 'success');
          this.pilarAdicionado.emit();
          this.saving = false;
          this.pilarIdSelecionado = null;
          this.form.reset();
          this.form.markAsUntouched();
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'Erro ao criar pilar';
          this.showToast(errorMsg, 'error');
          this.saving = false;
        }
      });
    } else {
      this.pilaresEmpresaService.vincularPilares(this.empresaId, [this.pilarIdSelecionado]).subscribe({
        next: () => {
          const pilarNome = this.pilaresDisponiveis.find(p => p.id === this.pilarIdSelecionado)?.nome;
          this.showToast(`Pilar "${pilarNome}" adicionado com sucesso!`, 'success');
          this.pilarAdicionado.emit();
          this.saving = false;
          this.pilarIdSelecionado = null;
          this.form.reset();
          this.form.markAsUntouched();
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'Erro ao adicionar pilar';
          this.showToast(errorMsg, 'error');
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
