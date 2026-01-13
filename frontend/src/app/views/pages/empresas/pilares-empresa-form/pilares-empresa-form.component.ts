import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { PilaresEmpresaService, PilarEmpresa, CreatePilarEmpresaDto } from '../../../../core/services/pilares-empresa.service';

@Component({
  selector: 'app-pilares-empresa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, DragDropModule, NgbTooltip],
  templateUrl: './pilares-empresa-form.component.html',
  styleUrl: './pilares-empresa-form.component.scss'
})
export class PilaresEmpresaFormComponent implements OnInit {
  private pilaresService = inject(PilaresService);
  private pilaresEmpresaService = inject(PilaresEmpresaService);

  @Input() empresaId!: string;
  @Input() isPerfilCliente: boolean = false;
  @Output() pilaresChanged = new EventEmitter<void>();

  pilaresDisponiveis: Pilar[] = [];
  pilaresAssociados: PilarEmpresa[] = [];
  loading = false;
  temAlteracoes = false;
  editandoPilarId: string | null = null;
  nomeEditando: string = '';

  ngOnInit(): void {
    if (!this.isPerfilCliente) {
      this.loadPilaresDisponiveis();
    }
    if (this.empresaId) {
      this.loadPilaresAssociados(this.empresaId);
    }
  }

  addPilarTag = (nome: string): PilarEmpresa | Promise<PilarEmpresa> => {
    if (!this.empresaId) {
      this.showToast('ID da empresa não informado', 'error');
      return Promise.reject('ID da empresa não informado');
    }

    // Validar limite de 60 caracteres
    if (nome.length > 60) {
      this.showToast('O nome do pilar deve ter no máximo 60 caracteres', 'error');
      return Promise.reject('Nome muito longo');
    }

    if (nome.length < 2) {
      this.showToast('O nome do pilar deve ter no mínimo 2 caracteres', 'error');
      return Promise.reject('Nome muito curto');
    }

    const novoPilar: CreatePilarEmpresaDto = {
      nome: nome
    };

    return new Promise((resolve, reject) => {
      this.pilaresEmpresaService.criarPilarCustomizado(this.empresaId, novoPilar).subscribe({
        next: (pilarEmpresa) => {
          this.showToast(`Pilar "${nome}" criado com sucesso!`, 'success');
          this.pilaresAssociados.push(pilarEmpresa);
          this.pilaresChanged.emit();
          resolve(pilarEmpresa);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao criar pilar', 'error');
          reject(err);
        }
      });
    });
  };

  loadPilaresDisponiveis(): void {
    this.pilaresService.findAll().subscribe({
      next: (pilares) => {
        this.pilaresDisponiveis = pilares.filter(p => p.ativo);
      },
      error: (err) => {
        console.error('Erro ao carregar pilares disponíveis:', err);
      }
    });
  }

  loadPilaresAssociados(empresaId: string): void {
    this.loading = true;
    this.pilaresEmpresaService.listarPilaresDaEmpresa(empresaId).subscribe({
      next: (pilaresEmpresa) => {
        this.pilaresAssociados = pilaresEmpresa;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar pilares associados:', err);
        this.loading = false;
      }
    });
  }

  associarPilar(pilar: Pilar): void {
    if (!this.empresaId) {
      this.showToast('ID da empresa não informado', 'error');
      return;
    }

    this.pilaresEmpresaService.vincularPilares(this.empresaId, [pilar.id]).subscribe({
      next: (response) => {
        if (response.vinculados > 0) {
          this.showToast(`Pilar ${pilar.nome} associado com sucesso!`, 'success');
          this.pilaresAssociados = response.pilares;
          this.pilaresDisponiveis = this.pilaresDisponiveis.filter(p => p.id !== pilar.id);
          this.pilaresChanged.emit();
        } else {
          this.showToast('Pilar já estava associado', 'info');
        }
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao associar pilar', 'error');
      }
    });
  }

  /**
   * Método chamado quando um item é selecionado no ng-select
   * Verifica se é um Pilar (template) ou PilarEmpresa (criado via addTag)
   */
  onPilarSelected(item: Pilar | PilarEmpresa | null): void {
    if (!item) return;
    
    // Se tem pilarTemplateId, é um PilarEmpresa criado via addTag, não precisa vincular
    if ('pilarTemplateId' in item) {
      return;
    }
    
    // É um Pilar template, precisa vincular
    this.associarPilar(item as Pilar);
  }

  removePillarAssociation(pilarEmpresa: PilarEmpresa): void {
    Swal.fire({
      title: 'Remover Pilar',
      html: `Deseja remover o pilar <strong>${pilarEmpresa.nome}</strong> desta empresa?`,
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.empresaId) {
        this.pilaresEmpresaService.removerPilar(this.empresaId, pilarEmpresa.id).subscribe({
          next: () => {
            this.showToast(`Pilar ${pilarEmpresa.nome} removido com sucesso!`, 'success');
            this.pilaresAssociados = this.pilaresAssociados.filter(p => p.id !== pilarEmpresa.id);
            // Se tiver template, adicionar de volta aos disponíveis
            if (pilarEmpresa.pilarTemplate) {
              this.pilaresDisponiveis.push(pilarEmpresa.pilarTemplate);
            }
            this.pilaresChanged.emit();
          },
          error: (err: any) => {
            this.showToast(err?.error?.message || 'Erro ao remover pilar', 'error');
          }
        });
      }
    });
  }

  onDropPilares(event: CdkDragDrop<PilarEmpresa[]>): void {

    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.pilaresAssociados, event.previousIndex, event.currentIndex);
      
      // Atualizar a ordem de todas as pilares
      this.pilaresAssociados.forEach((pilar, index) => {
        pilar.ordem = index + 1;
      });
      
      this.temAlteracoes = true;
    }
  }

  async salvarOrdem(): Promise<void> {
    try {
      const novasOrdens = this.pilaresAssociados.map((p, idx) => ({
        id: p.id,
        ordem: idx + 1
      }));

      if (this.empresaId) {
        await this.pilaresEmpresaService.reordenarPilares(this.empresaId, novasOrdens).toPromise();
      
      this.showToast('Ordem das pilares atualizada com sucesso.', 'success');
      
      this.temAlteracoes = false;
      this.pilaresChanged.emit();
    }
      
    } catch (error) {
      this.showToast('Erro ao salvar a ordem das pilares. Tente novamente', 'error');
    }
  }

  /**
   * Inicia edição do nome do pilar
   */
  iniciarEdicaoNome(pilarEmpresa: PilarEmpresa): void {
    this.editandoPilarId = pilarEmpresa.id;
    this.nomeEditando = pilarEmpresa.nome;
  }

  /**
   * Cancela edição do nome
   */
  cancelarEdicaoNome(): void {
    this.editandoPilarId = null;
    this.nomeEditando = '';
  }

  /**
   * Salva o novo nome do pilar
   */
  salvarNomePilar(pilarEmpresa: PilarEmpresa): void {
    if (!this.empresaId) {
      this.showToast('ID da empresa não informado', 'error');
      return;
    }

    const nomeNovo = this.nomeEditando.trim();

    // Validações
    if (nomeNovo.length < 2) {
      this.showToast('O nome do pilar deve ter no mínimo 2 caracteres', 'error');
      return;
    }

    if (nomeNovo.length > 60) {
      this.showToast('O nome do pilar deve ter no máximo 60 caracteres', 'error');
      return;
    }

    if (nomeNovo === pilarEmpresa.nome) {
      this.cancelarEdicaoNome();
      return;
    }

    this.pilaresEmpresaService.updatePilarEmpresa(this.empresaId, pilarEmpresa.id, { nome: nomeNovo }).subscribe({
      next: (pilarAtualizado) => {
        this.showToast(`Nome do pilar atualizado para "${nomeNovo}"`, 'success');
        // Atualizar na lista local
        const index = this.pilaresAssociados.findIndex(p => p.id === pilarEmpresa.id);
        if (index !== -1) {
          this.pilaresAssociados[index] = pilarAtualizado;
        }
        this.cancelarEdicaoNome();
        this.pilaresChanged.emit();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao atualizar nome do pilar', 'error');
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
