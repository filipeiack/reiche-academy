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
          Adicionar Novo Pilar
        </h5>
        <button type="button" class="btn-close" (click)="fechar()"></button>
      </div>

      <div class="offcanvas-body flex-grow-1 overflow-auto">
        <!-- Toggle: Selecionar vs Criar -->
        <div class="mb-4">
          <div class="btn-group w-100" role="group">
            <input 
              type="radio" 
              class="btn-check" 
              name="pilar-mode" 
              id="mode-criar" 
              [checked]="isCriarNovoMode === true"
              (change)="isCriarNovoMode = true"
            />
            <label class="btn btn-outline-primary" for="mode-criar">
              <i class="feather icon-plus-circle me-2"></i>
              Criar Pilar Customizado
            </label>

            <input 
              type="radio" 
              class="btn-check" 
              name="pilar-mode" 
              id="mode-selecionar" 
              [checked]="isCriarNovoMode === false"
              (change)="isCriarNovoMode = false"
            />
            <label class="btn btn-outline-primary" for="mode-selecionar">
              <i class="feather icon-search me-2"></i>
              Selecionar Pilar Template
            </label>
          </div>
        </div>

        <form [formGroup]="form">
          <!-- MODO 1: Criar Novo Pilar (PADRÃO) -->
          @if (isCriarNovoMode) {
            <div class="mb-3">
              <label class="form-label" for="novo-pilar-nome">
                Nome do Novo Pilar <span class="text-danger">*</span>
              </label>
              <input 
                type="text" 
                class="form-control"
                id="novo-pilar-nome"
                [(ngModel)]="novoNomePilar"
                [ngModelOptions]="{standalone: true}"
                placeholder="Ex: Inovação, Sustentabilidade, RH..."
                (input)="validarNomoPilar()"
              />
              @if (novoNomePilarErro) {
                <small class="text-danger d-block mt-1">
                  <i class="feather icon-alert-circle me-1"></i>
                  {{ novoNomePilarErro }}
                </small>
              }
            </div>
            <div class="alert alert-info alert-sm">
              <i class="feather icon-info me-2"></i>
              <small>Digite um nome único para criar um novo pilar customizado.</small>
            </div>
          }

          <!-- MODO 2: Selecionar Pilar Template -->
          @if (!isCriarNovoMode) {
            <div class="mb-3">
              <label class="form-label">
                Selecione um Pilar <span class="text-danger">*</span>
              </label>
              @if (loadingPilares) {
                <div class="text-center py-3">
                  <div class="spinner-border text-primary spinner-border-sm" role="status">
                    <span class="visually-hidden">Carregando pilares...</span>
                  </div>
                </div>
              } @else {
                @if (pilaresDisponiveis.length === 0) {
                  <div class="alert alert-warning mb-0">
                    <i class="feather icon-alert-circle me-2"></i>
                    Nenhum pilar disponível para vincular.
                  </div>
                } @else {
                  <ng-select 
                    [items]="pilaresDisponiveis" 
                    bindLabel="nome" 
                    bindValue="id"
                    [(ngModel)]="pilarIdSelecionado"
                    [ngModelOptions]="{standalone: true}"
                    placeholder="Escolha um pilar da lista..."
                    [clearable]="true"
                    (change)="onPilarSelected()">
                    <ng-template ng-option-tmp let-item="item">
                      <div class="d-flex align-items-center">
                        <i class="feather icon-layers me-2"></i>
                        <div>
                          <div class="fw-500">{{ item.nome }}</div>
                          @if (item.descricao) {
                            <small class="text-muted">{{ item.descricao }}</small>
                          }
                        </div>
                      </div>
                    </ng-template>
                  </ng-select>
                }
              }
            </div>
            <div class="alert alert-info alert-sm">
              <i class="feather icon-info me-2"></i>
              <small>Escolha um template de pilar já cadastrado no sistema.</small>
            </div>
          }

          <div class="alert alert-secondary alert-sm">
            <i class="feather icon-layers me-2"></i>
            <small>
              Este drawer permanecerá aberto para adicionar múltiplos pilares.
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
  
  // Novo modo: separar selecionar vs criar
  // ⭐ MODO PADRÃO = Criar Novo Pilar (mais intuitivo)
  isCriarNovoMode = true;
  novoNomePilar = '';
  novoNomePilarErro = '';
  
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

  onPilarSelected(): void {
    // Validação ocorre apenas ao clicar em Salvar
  }

  validarNomoPilar(): void {
    this.novoNomePilarErro = '';

    if (!this.novoNomePilar.trim()) {
      return; // Vazio é OK (campo opcional até clicar em salvar)
    }

    if (this.novoNomePilar.trim().length < 5) {
      this.novoNomePilarErro = 'Mínimo 5 caracteres';
      return;
    }

    if (this.novoNomePilar.length > 60) {
      this.novoNomePilarErro = 'Máximo 60 caracteres';
      return;
    }

    // Verificar se já existe
    const existe = this.pilaresDisponiveis.some(
      p => p.nome.toLowerCase() === this.novoNomePilar.toLowerCase()
    );
    
    if (existe) {
      this.novoNomePilarErro = 'Pilar com este nome já existe';
    }
  }

  salvar(): void {
    // Validar modo Selecionar
    if (!this.isCriarNovoMode) {
      if (!this.pilarIdSelecionado) {
        this.showToast('Selecione um pilar', 'warning');
        return;
      }

      if (!this.empresaId) {
        this.showToast('Empresa não identificada', 'error');
        return;
      }

      // Verificar duplicação de template
      if (this.pilaresJaAssociados.includes(this.pilarIdSelecionado)) {
        const pilarNome = this.pilaresDisponiveis.find(p => p.id === this.pilarIdSelecionado)?.nome || 'Este pilar';
        this.showToast(`${pilarNome} já está vinculado a esta empresa`, 'warning');
        return;
      }

      this.saving = true;
      this.pilaresEmpresaService.vincularPilares(this.empresaId, [this.pilarIdSelecionado]).subscribe({
        next: () => {
          const pilarNome = this.pilaresDisponiveis.find(p => p.id === this.pilarIdSelecionado)?.nome;
          this.showToast(`Pilar "${pilarNome}" adicionado com sucesso!`, 'success');
          this.pilarAdicionado.emit();
          this.saving = false;
          this.resetForm();
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'Erro ao adicionar pilar';
          this.showToast(errorMsg, 'error');
          this.saving = false;
        }
      });

      return;
    }

    // Validar modo Criar Novo
    this.validarNomoPilar();

    if (this.novoNomePilarErro || !this.novoNomePilar.trim()) {
      this.showToast('Preencha um nome válido para o novo pilar', 'warning');
      return;
    }

    if (!this.empresaId) {
      this.showToast('Empresa não identificada', 'error');
      return;
    }

    this.saving = true;
    this.pilaresEmpresaService.criarPilarCustomizado(this.empresaId, { nome: this.novoNomePilar.trim() }).subscribe({
      next: (pilar) => {
        this.showToast(`Pilar "${pilar.nome}" criado com sucesso!`, 'success');
        this.pilarAdicionado.emit();
        this.saving = false;
        this.resetForm();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Erro ao criar pilar';
        this.showToast(errorMsg, 'error');
        this.saving = false;
      }
    });
  }

  private resetForm(): void {
    this.pilarIdSelecionado = null;
    this.novoNomePilar = '';
    this.novoNomePilarErro = '';
    this.form.reset();
    this.form.markAsUntouched();
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
