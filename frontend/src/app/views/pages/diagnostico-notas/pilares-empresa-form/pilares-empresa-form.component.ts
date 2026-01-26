import { Component, Input, Output, EventEmitter, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { PilaresEmpresaService, PilarEmpresa } from '../../../../core/services/pilares-empresa.service';
import { AdicionarPilarModalComponent } from '../adicionar-pilar-modal/adicionar-pilar-modal.component';

@Component({
  selector: 'app-pilares-empresa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, NgbTooltip, AdicionarPilarModalComponent],
  templateUrl: './pilares-empresa-form.component.html',
  styleUrl: './pilares-empresa-form.component.scss'
})
export class PilaresEmpresaFormComponent implements OnInit {
  private pilaresEmpresaService = inject(PilaresEmpresaService);

  @ViewChild(AdicionarPilarModalComponent) adicionarPilarModal!: AdicionarPilarModalComponent;
  @Input() empresaId!: string;
  @Input() isPerfilCliente: boolean = false;
  @Output() pilaresChanged = new EventEmitter<void>();

  pilaresAssociados: PilarEmpresa[] = [];
  loading = false;
  editandoPilarId: string | null = null;
  nomeEditando: string = '';

  ngOnInit(): void {
    if (this.empresaId) {
      this.loadPilaresAssociados(this.empresaId);
    }
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

  abrirModalAdicionarPilar(): void {
    this.adicionarPilarModal.open();
  }

  handlePilarAdicionado(): void {
    this.loadPilaresAssociados(this.empresaId);
    this.pilaresChanged.emit();
  }

  get pilaresAssociadosIds(): string[] {
    return this.pilaresAssociados.map(p => p.pilarTemplateId || p.id);
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
      
      // Atualizar a ordem de todos os pilares
      this.pilaresAssociados.forEach((pilar, index) => {
        pilar.ordem = index + 1;
      });
      
      // Salvar automaticamente
      this.salvarOrdem();
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
      
      this.showToast('Ordem dos pilares atualizada com sucesso.', 'success');
      this.pilaresChanged.emit();
    }
      
    } catch (error) {
      this.showToast('Erro ao salvar a ordem dos pilares. Tente novamente', 'error');
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
