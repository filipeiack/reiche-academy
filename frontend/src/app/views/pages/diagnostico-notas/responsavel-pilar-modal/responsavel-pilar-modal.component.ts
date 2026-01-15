import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { UsersService, CreateUsuarioDto } from '../../../../core/services/users.service';
import { PilaresEmpresaService } from '../../../../core/services/pilares-empresa.service';
import { PerfisService } from '../../../../core/services/perfis.service';
import { Usuario } from '../../../../core/models/auth.model';
import { PilarEmpresa } from '../../../../core/services/diagnostico-notas.service';

@Component({
  selector: 'app-responsavel-pilar-modal',
  standalone: true,
  imports: [CommonModule, NgbModalModule, NgSelectModule, FormsModule],
  template: `
    <ng-template #modalContent let-modal>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="feather icon-user me-2"></i>
          Definir Responsável pelo Pilar
        </h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        @if (pilarEmpresa) {
        <div class="mb-3">
          <p class="text-muted">
            <strong>Pilar:</strong> {{ pilarEmpresa.nome }}
          </p>
        </div>

        @if (loading) {
        <div class="text-center py-3">
          <div class="spinner-border text-primary spinner-border-sm" role="status">
            <span class="visually-hidden">Carregando usuários...</span>
          </div>
        </div>
        } @else {
        <div class="mb-3">
          <label class="form-label">Selecione o Responsável</label>
          <ng-select 
            [items]="usuarios" 
            bindLabel="nome" 
            bindValue="id"
            [(ngModel)]="responsavelIdSelecionado"
            placeholder="Digite para adicionar ou selecione um usuário existente"
            [clearable]="true"
            [addTag]="addUsuarioTag">
            <ng-template ng-option-tmp let-item="item">
              <div>
                <div><strong>{{ item.nome }}</strong></div>
                <small class="text-muted">{{ item.email }}</small>
              </div>
            </ng-template>
          </ng-select>
          <small class="text-muted">
            Deixe em branco para remover o responsável atual
          </small>
        </div>
        }
        }
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">Cancelar</button>
        <button type="button" class="btn btn-primary" (click)="salvar()" [disabled]="loading || saving">
          @if (saving) {
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
          }
          Salvar
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    :host ::ng-deep .modal-body {
      padding: 1.5rem;
    }
  `]
})
export class ResponsavelPilarModalComponent implements OnInit {
  private modalService = inject(NgbModal);
  private usersService = inject(UsersService);
  private pilaresEmpresaService = inject(PilaresEmpresaService);
  private perfisService = inject(PerfisService);
  
  @ViewChild('modalContent') modalContent!: TemplateRef<any>;
  @Input() pilarEmpresa?: PilarEmpresa;
  @Input() empresaId?: string;
  @Output() responsavelAtualizado = new EventEmitter<void>();

  private modalRef: any;
  private perfilColaboradorId: string | null = null;
  usuarios: Usuario[] = [];
  responsavelIdSelecionado: string | null = null;
  loading = false;
  saving = false;

  ngOnInit(): void {
    this.carregarPerfilColaborador();
    if (this.empresaId) {
      this.loadUsuariosDaEmpresa();
    }
  }

  private carregarPerfilColaborador(): void {
    this.perfisService.findAll().subscribe({
      next: (perfis) => {
        const perfilColab = perfis.find(p => p.codigo === 'COLABORADOR');
        if (perfilColab) {
          this.perfilColaboradorId = perfilColab.id;
        } else {
          console.error('Perfil COLABORADOR não encontrado');
          this.showToast('Perfil COLABORADOR não configurado no sistema', 'error');
        }
      },
      error: (err) => {
        console.error('Erro ao carregar perfis:', err);
        this.showToast('Erro ao carregar perfis do sistema', 'error');
      }
    });
  }

  open(pilarEmpresa: PilarEmpresa): void {
    this.pilarEmpresa = pilarEmpresa;
    this.responsavelIdSelecionado = pilarEmpresa.responsavelId || null;
    
    if (this.empresaId) {
      this.loadUsuariosDaEmpresa();
    }
    
    this.modalRef = this.modalService.open(this.modalContent, { 
      size: 'md',
      backdrop: 'static',
      keyboard: false 
    });
  }

  close(): void {
    this.modalRef?.close();
  }

  loadUsuariosDaEmpresa(): void {
    if (!this.empresaId) return;
    
    this.loading = true;
    this.usersService.getAll().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios.filter(u => u.empresaId === this.empresaId);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
        this.showToast('Erro ao carregar usuários da empresa', 'error');
        this.loading = false;
      }
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
      nome: nome,
      empresaId: this.empresaId!,
      perfilId: this.perfilColaboradorId
    };

    return new Promise((resolve, reject) => {
      this.usersService.create(novoUsuario).subscribe({
        next: (usuario) => {
          this.showToast(`Usuário "${nome}" criado com sucesso!`, 'success');
          this.usuarios.push(usuario);
          this.responsavelIdSelecionado = usuario.id;
          resolve(usuario);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao criar usuário', 'error');
          reject(err);
        }
      });
    });
  };

  salvar(): void {
    if (!this.pilarEmpresa || !this.empresaId) return;

    this.saving = true;
    this.pilaresEmpresaService.definirResponsavel(
      this.empresaId, 
      this.pilarEmpresa.id, 
      this.responsavelIdSelecionado || null
    ).subscribe({
      next: () => {
        const nomeResponsavel = this.responsavelIdSelecionado 
          ? this.usuarios.find(u => u.id === this.responsavelIdSelecionado)?.nome 
          : null;
        
        const mensagem = nomeResponsavel 
          ? `Responsável ${nomeResponsavel} atribuído com sucesso!`
          : 'Responsável removido com sucesso!';
        
        this.showToast(mensagem, 'success');
        this.responsavelAtualizado.emit();
        this.saving = false;
        this.close();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao definir responsável', 'error');
        this.saving = false;
      }
    });
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
