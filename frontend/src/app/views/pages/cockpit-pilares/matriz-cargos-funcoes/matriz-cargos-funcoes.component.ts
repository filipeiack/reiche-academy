import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgbAccordionModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import {
  CargoCockpit,
  FuncaoCargo,
  Criticidade,
} from '@core/interfaces/cockpit-pilares.interface';
import { OFFCANVAS_SIZE } from '@core/constants/ui.constants';
import { CargoFormDrawerComponent } from './cargo-form-drawer/cargo-form-drawer.component';
import { FuncaoFormDrawerComponent } from './funcao-form-drawer/funcao-form-drawer.component';

@Component({
  selector: 'app-matriz-cargos-funcoes',
  standalone: true,
  imports: [CommonModule, DragDropModule, NgbAccordionModule],
  templateUrl: './matriz-cargos-funcoes.component.html',
  styleUrl: './matriz-cargos-funcoes.component.scss',
})
export class MatrizCargosFuncoesComponent implements OnInit {
  @Input() cockpitId!: string;

  private cockpitService = inject(CockpitPilaresService);
  private offcanvasService = inject(NgbOffcanvas);

  cargos: CargoCockpit[] = [];
  loading = false;
  empresaId: string | null = null;

  ngOnInit(): void {
    this.loadCargos();
  }

  private loadCargos(): void {
    if (!this.cockpitId) return;
    this.loading = true;

    this.cockpitService.getCockpitById(this.cockpitId).subscribe({
      next: (cockpit) => {
        this.empresaId = cockpit.pilarEmpresa?.empresaId || null;
        this.cockpitService.getCargosByCockpit(this.cockpitId).subscribe({
          next: (cargos) => {
            this.cargos = cargos;
            this.loading = false;
          },
          error: (err) => {
            console.error('Erro ao carregar cargos:', err);
            this.showToast('Erro ao carregar cargos', 'error');
            this.cargos = [];
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error('Erro ao carregar cockpit:', err);
        this.loading = false;
      },
    });
  }

  abrirDrawerNovoCargo(): void {
    const offcanvasRef = this.offcanvasService.open(CargoFormDrawerComponent, {
      position: 'end',
      backdrop: 'static',
      panelClass: OFFCANVAS_SIZE.MEDIUM,
    });

    const component = offcanvasRef.componentInstance as CargoFormDrawerComponent;
    component.cockpitId = this.cockpitId;
    component.empresaId = this.empresaId || '';
    component.cargoSalvo.subscribe((cargo: CargoCockpit) => {
      this.cargos.push(cargo);
      this.recalcularOrdensCargos();
    });
  }

  editarCargo(cargo: CargoCockpit): void {
    const offcanvasRef = this.offcanvasService.open(CargoFormDrawerComponent, {
      position: 'end',
      backdrop: 'static',
      panelClass: OFFCANVAS_SIZE.MEDIUM,
    });

    const component = offcanvasRef.componentInstance as CargoFormDrawerComponent;
    component.cockpitId = this.cockpitId;
    component.empresaId = this.empresaId || '';
    component.cargoParaEditar = cargo;
    component.cargoSalvo.subscribe((cargoAtualizado: CargoCockpit) => {
      const index = this.cargos.findIndex((c) => c.id === cargoAtualizado.id);
      if (index >= 0) {
        this.cargos[index] = cargoAtualizado;
      }
    });
  }

  async deleteCargo(cargo: CargoCockpit): Promise<void> {
    const result = await Swal.fire({
      title: 'Remover Cargo',
      text: `Deseja remover o cargo "${cargo.cargo}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    this.cockpitService.deleteCargo(cargo.id).subscribe({
      next: () => {
        this.cargos = this.cargos.filter((c) => c.id !== cargo.id);
        this.recalcularOrdensCargos();
        this.showToast('Cargo removido com sucesso', 'success');
      },
      error: (err) => {
        console.error('Erro ao remover cargo:', err);
        this.showToast('Erro ao remover cargo', 'error');
      },
    });
  }

  onCargoDrop(event: CdkDragDrop<CargoCockpit[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.cargos, event.previousIndex, event.currentIndex);
      this.recalcularOrdensCargos();
      this.salvarOrdemCargos();
    }
  }

  private recalcularOrdensCargos(): void {
    this.cargos.forEach((cargo, index) => {
      cargo.ordem = index + 1;
    });
  }

  private async salvarOrdemCargos(): Promise<void> {
    try {
      const updates = this.cargos.map((cargo) =>
        this.cockpitService.updateCargo(cargo.id, { ordem: cargo.ordem }).toPromise()
      );

      await Promise.all(updates);
      this.showToast('Ordem dos cargos atualizada', 'success');
    } catch (error) {
      console.error('Erro ao reordenar cargos:', error);
      this.showToast('Erro ao reordenar cargos', 'error');
    }
  }

  abrirDrawerNovaFuncao(cargo: CargoCockpit): void {
    const offcanvasRef = this.offcanvasService.open(FuncaoFormDrawerComponent, {
      position: 'end',
      backdrop: 'static',
      panelClass: OFFCANVAS_SIZE.MEDIUM,
    });

    const component = offcanvasRef.componentInstance as FuncaoFormDrawerComponent;
    component.cargoId = cargo.id;
    component.funcaoSalva.subscribe((funcao: FuncaoCargo) => {
      cargo.funcoes = cargo.funcoes || [];
      cargo.funcoes.push(funcao);
      this.recalcularOrdensFuncoes(cargo);
    });
  }

  editarFuncao(cargo: CargoCockpit, funcao: FuncaoCargo): void {
    const offcanvasRef = this.offcanvasService.open(FuncaoFormDrawerComponent, {
      position: 'end',
      backdrop: 'static',
      panelClass: OFFCANVAS_SIZE.MEDIUM,
    });

    const component = offcanvasRef.componentInstance as FuncaoFormDrawerComponent;
    component.cargoId = cargo.id;
    component.funcaoParaEditar = funcao;
    component.funcaoSalva.subscribe((funcaoAtualizada: FuncaoCargo) => {
      const index = cargo.funcoes?.findIndex((f) => f.id === funcaoAtualizada.id) ?? -1;
      if (index >= 0 && cargo.funcoes) {
        cargo.funcoes[index] = funcaoAtualizada;
      }
    });
  }

  async deleteFuncao(cargo: CargoCockpit, funcao: FuncaoCargo): Promise<void> {
    const result = await Swal.fire({
      title: 'Remover Função',
      text: `Deseja remover a função "${funcao.descricao}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    this.cockpitService.deleteFuncaoCargo(funcao.id).subscribe({
      next: () => {
        cargo.funcoes = (cargo.funcoes || []).filter((f) => f.id !== funcao.id);
        this.recalcularOrdensFuncoes(cargo);
        this.showToast('Função removida com sucesso', 'success');
      },
      error: (err) => {
        console.error('Erro ao remover função:', err);
        this.showToast('Erro ao remover função', 'error');
      },
    });
  }

  onFuncaoDrop(cargo: CargoCockpit, event: CdkDragDrop<FuncaoCargo[]>): void {
    if (!cargo.funcoes) return;

    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(cargo.funcoes, event.previousIndex, event.currentIndex);
      this.recalcularOrdensFuncoes(cargo);
      this.salvarOrdemFuncoes(cargo);
    }
  }

  private recalcularOrdensFuncoes(cargo: CargoCockpit): void {
    if (!cargo.funcoes) return;
    cargo.funcoes.forEach((funcao, index) => {
      funcao.ordem = index + 1;
    });
  }

  private async salvarOrdemFuncoes(cargo: CargoCockpit): Promise<void> {
    if (!cargo.funcoes) return;

    try {
      const updates = cargo.funcoes.map((funcao) =>
        this.cockpitService.updateFuncaoCargo(funcao.id, { ordem: funcao.ordem }).toPromise()
      );

      await Promise.all(updates);
      this.showToast('Ordem das funções atualizada', 'success');
    } catch (error) {
      console.error('Erro ao reordenar funções:', error);
      this.showToast('Erro ao reordenar funções', 'error');
    }
  }

  getResponsaveisLabel(cargo: CargoCockpit): string {
    if (!cargo.responsaveis || cargo.responsaveis.length === 0) return '-';
    return cargo.responsaveis
      .map((r) => r.usuario?.nome)
      .filter(Boolean)
      .join(', ');
  }

  getCriticidadeClass(criticidade: Criticidade): string {
    switch (criticidade) {
      case Criticidade.ALTA:
        return 'bg-danger';
      case Criticidade.MEDIA:
        return 'bg-warning text-dark';
      case Criticidade.BAIXA:
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getMediaAuto(cargo: CargoCockpit): number | null {
    const notas = (cargo.funcoes || [])
      .map((f) => f.autoAvaliacao)
      .filter((n): n is number => n !== null && n !== undefined);

    if (!notas.length) return null;
    const total = notas.reduce((acc, n) => acc + n, 0);
    return Number((total / notas.length).toFixed(2));
  }

  getMediaLideranca(cargo: CargoCockpit): number | null {
    const notas = (cargo.funcoes || [])
      .map((f) => f.avaliacaoLideranca)
      .filter((n): n is number => n !== null && n !== undefined);

    if (!notas.length) return null;
    const total = notas.reduce((acc, n) => acc + n, 0);
    return Number((total / notas.length).toFixed(2));
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
