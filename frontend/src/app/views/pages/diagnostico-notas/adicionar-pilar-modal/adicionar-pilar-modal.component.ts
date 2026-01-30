import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { PilaresEmpresaService } from '../../../../core/services/pilares-empresa.service';

@Component({
  selector: 'app-adicionar-pilar-modal',
  standalone: true,
  imports: [CommonModule, NgbModalModule, NgSelectModule, FormsModule],
  template: `
    <ng-template #modalContent let-modal>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="feather icon-plus me-2"></i>
          Adicionar Pilar
        </h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        <p class="text-muted mb-3">
          Selecione um pilar template ou digite o nome do novo pilar.
        </p>

        @if (loading) {
        <div class="text-center py-3">
          <div class="spinner-border text-primary spinner-border-sm" role="status">
            <span class="visually-hidden">Carregando pilares...</span>
          </div>
        </div>
        } @else {
        <div class="mb-3">
          <ng-select 
            [items]="pilaresDisponiveis" 
            bindLabel="nome" 
            bindValue="id"
            [(ngModel)]="pilarIdSelecionado"
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

          <span class="text-muted small mb-0">
            <i class="feather icon-info me-1"></i>
            Esta janela permanecerá aberta para que você possa adicionar vários pilares rapidamente.
          </span>
        </div>
        }
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">Cancelar</button>
        <button type="button" class="btn btn-primary" (click)="adicionar()" [disabled]="!pilarIdSelecionado || saving">
          @if (saving) {
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
          }
          Adicionar Pilar
        </button>
      </div>
    </ng-template>
  `,
  styles: []
})
export class AdicionarPilarModalComponent implements OnInit {
  private modalService = inject(NgbModal);
  private pilaresService = inject(PilaresService);
  private pilaresEmpresaService = inject(PilaresEmpresaService);

  @ViewChild('modalContent') modalContent!: TemplateRef<any>;
  @Input() empresaId?: string;
  @Input() pilaresJaAssociados: string[] = []; // IDs dos pilares já associados
  @Output() pilarAdicionado = new EventEmitter<void>();

  pilaresDisponiveis: Pilar[] = [];
  pilarIdSelecionado: string | null = null;
  loading = false;
  saving = false;
  private modalRef: any;
  private pilaresCustomizados = new Set<string>(); // Armazena nomes de pilares customizados criados
  private pilaresOriginaisIds = new Set<string>(); // IDs dos pilares originais carregados

  ngOnInit(): void {
    this.loadPilaresDisponiveis();
  }

  open(): void {
    this.pilarIdSelecionado = null;
    this.pilaresCustomizados.clear();
    this.pilaresOriginaisIds = new Set(this.pilaresDisponiveis.map(p => p.id));
    this.modalRef = this.modalService.open(this.modalContent, { 
      size: 'md',
      backdrop: 'static',
      keyboard: false 
    });
  }

  close(): void {
    this.modalRef?.dismiss();
  }

  loadPilaresDisponiveis(): void {
    this.loading = true;
    this.pilaresService.findAll().subscribe({
      next: (pilares) => {
        // Filtra apenas pilares ativos e que não estão já associados
        this.pilaresDisponiveis = pilares.filter(
          p => p.ativo && !this.pilaresJaAssociados.includes(p.id)
        );
        this.pilaresOriginaisIds = new Set(this.pilaresDisponiveis.map(p => p.id));
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar pilares:', err);
        this.loading = false;
        this.showToast(err?.error?.message || 'Erro ao carregar pilares', 'error');
      }
    });
  }

  addPilarTag = (nome: string): Pilar | Promise<Pilar> => {
    // Validar limite de 60 caracteres
    if (nome.length > 60) {
      this.showToast('O nome do pilar deve ter no máximo 60 caracteres', 'error');
      return Promise.reject('Nome muito longo');
    }

    if (nome.length < 2) {
      this.showToast('O nome do pilar deve ter no mínimo 2 caracteres', 'error');
      return Promise.reject('Nome muito curto');
    }

    // Apenas registrar o nome do pilar customizado
    // Não criar na base de dados aqui, apenas retornar um objeto fake para o ng-select renderizar
    this.pilaresCustomizados.add(nome);
    
    // Retornar um objeto fake com o nome para o ng-select exibir
    const pilarFake: Pilar = {
      id: nome, // Usar o nome como ID temporário para identificar depois
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

  adicionar(): void {
    if (!this.pilarIdSelecionado || !this.empresaId) {
      return;
    }

    this.saving = true;

    // Verificar se é um pilar customizado (novo) ou um template existente
    const isCustomizado = this.pilaresCustomizados.has(this.pilarIdSelecionado) || 
                          !this.pilaresOriginaisIds.has(this.pilarIdSelecionado);

    if (isCustomizado) {
      // Criar como PilarEmpresa customizado
      this.pilaresEmpresaService.criarPilarCustomizado(this.empresaId, { nome: this.pilarIdSelecionado }).subscribe({
        next: (pilarEmpresa) => {
          this.showToast(`Pilar "${pilarEmpresa.nome}" criado com sucesso!`, 'success');
          this.pilarAdicionado.emit();
          this.saving = false;
          this.pilarIdSelecionado = null; // Limpa para adicionar outro
          // Mantém a modal aberta
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao adicionar pilar', 'error');
          this.saving = false;
        }
      });
    } else {
      // Vincular um pilar template existente
      this.pilaresEmpresaService.vincularPilares(this.empresaId, [this.pilarIdSelecionado]).subscribe({
        next: () => {
          const pilarNome = this.pilaresDisponiveis.find(p => p.id === this.pilarIdSelecionado)?.nome;
          this.showToast(`Pilar "${pilarNome}" adicionado com sucesso!`, 'success');
          this.pilarAdicionado.emit();
          this.saving = false;
          this.pilarIdSelecionado = null; // Limpa para adicionar outro
          // Mantém a modal aberta
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao adicionar pilar', 'error');
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
