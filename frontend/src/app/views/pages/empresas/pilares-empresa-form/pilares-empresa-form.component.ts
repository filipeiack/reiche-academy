import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
import { PilaresService, Pilar, CreatePilarDto } from '../../../../core/services/pilares.service';
import { PilaresEmpresaService, PilarEmpresa } from '../../../../core/services/pilares-empresa.service';

@Component({
  selector: 'app-pilares-empresa-form',
  standalone: true,
  imports: [CommonModule, NgSelectModule, DragDropModule],
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

  ngOnInit(): void {
    if (!this.isPerfilCliente) {
      this.loadPilaresDisponiveis();
    }
    if (this.empresaId) {
      this.loadPilaresAssociados(this.empresaId);
    }
  }

  addPilarTag = (nome: string): Pilar | Promise<Pilar> => {
    const novoPilar: CreatePilarDto = {
      nome: nome,
      modelo: false
    };

    return new Promise((resolve, reject) => {
      this.pilaresService.create(novoPilar).subscribe({
        next: (pilar) => {
          this.showToast(`Pilar "${nome}" criado com sucesso!`, 'success');
          resolve(pilar);
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
