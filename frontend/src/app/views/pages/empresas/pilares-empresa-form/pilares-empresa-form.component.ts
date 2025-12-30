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
      html: `Deseja remover o pilar <strong>${pilarEmpresa.pilar.nome}</strong> desta empresa?`,
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.empresaId) {
        this.pilaresEmpresaService.removerPilar(this.empresaId, pilarEmpresa.id).subscribe({
          next: () => {
            this.showToast(`Pilar ${pilarEmpresa.pilar.nome} removido com sucesso!`, 'success');
            this.pilaresAssociados = this.pilaresAssociados.filter(p => p.id !== pilarEmpresa.id);
            this.pilaresDisponiveis.push(pilarEmpresa.pilar);
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
    if (this.isPerfilCliente) return;

    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (previousIndex === currentIndex) return;

    moveItemInArray(this.pilaresAssociados, previousIndex, currentIndex);

    const novasOrdens = this.pilaresAssociados.map((pe, idx) => ({
      id: pe.id,
      ordem: idx + 1
    }));

    if (this.empresaId) {
      this.pilaresEmpresaService.reordenarPilares(this.empresaId, novasOrdens).subscribe({
        next: () => {
          this.showToast('Pilares reordenados com sucesso!', 'success');
          this.loadPilaresAssociados(this.empresaId);
          this.pilaresChanged.emit();
        },
        error: (err: any) => {
          this.showToast(err?.error?.message || 'Erro ao reordenar pilares', 'error');
          this.loadPilaresAssociados(this.empresaId);
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
