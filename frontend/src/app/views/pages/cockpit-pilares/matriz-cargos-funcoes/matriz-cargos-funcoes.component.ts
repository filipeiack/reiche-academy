import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
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
import { TranslatePipe } from "../../../../core/pipes/translate.pipe";

@Component({
  selector: 'app-matriz-cargos-funcoes',
  standalone: true,
  imports: [CommonModule, DragDropModule, TranslatePipe],
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
  cargoExpandido: Record<string, boolean> = {};

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
            this.inicializarExpansaoCargos();
            this.loading = false;
          },
          error: (err) => {
            console.error('Erro ao carregar cargos:', err);
            this.showToast(err?.error?.message || 'Erro ao carregar cargos', 'error');
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
      this.cargoExpandido[cargo.id] = true;
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
        this.showToast(err?.error?.message || 'Erro ao remover cargo', 'error');
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
      const message = (error as any)?.error?.message || 'Erro ao reordenar cargos';
      this.showToast(message, 'error');
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
    component.cargoNome = cargo.cargo;
    
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
    component.cargoNome = cargo.cargo;
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
        this.showToast(err?.error?.message || 'Erro ao remover função', 'error');
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
      const message = (error as any)?.error?.message || 'Erro ao reordenar funções';
      this.showToast(message, 'error');
    }
  }

  getResponsaveisLabel(cargo: CargoCockpit): string {
    if (!cargo.responsaveis || cargo.responsaveis.length === 0) return '-';
    return cargo.responsaveis
      .map((r) => r.usuario?.nome)
      .filter(Boolean)
      .join(', ');
  }

  toggleCargo(cargoId: string): void {
    this.cargoExpandido[cargoId] = !this.cargoExpandido[cargoId];
  }

  isCargoExpanded(cargoId: string): boolean {
    return !!this.cargoExpandido[cargoId];
  }

  private inicializarExpansaoCargos(): void {
    this.cargos.forEach((cargo) => {
      if (this.cargoExpandido[cargo.id] === undefined) {
        this.cargoExpandido[cargo.id] = true;
      }
    });
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

  getDesvio(funcao: FuncaoCargo): number {
    if (
      funcao.autoAvaliacao === null || 
      funcao.autoAvaliacao === undefined || 
      funcao.avaliacaoLideranca === null || 
      funcao.avaliacaoLideranca === undefined
    ) {
      return 0;
    }
    return Math.abs(funcao.autoAvaliacao - funcao.avaliacaoLideranca);
  }

  getDesvioClass(funcao: FuncaoCargo): string {
    const desvio = this.getDesvio(funcao);
    
    if (desvio === 0) {
      return 'bg-success text-dark'; // Verde
    } else if (desvio === 1) {
      return 'bg-warning text-dark'; // Amarelo
    } else {
      return 'bg-danger text-dark'; // Vermelho (2 ou mais)
    }
  }

  getDesvioMedia(cargo: CargoCockpit): number {
    const mediaAuto = this.getMediaAuto(cargo);
    const mediaLideranca = this.getMediaLideranca(cargo);
    
    if (mediaAuto === null || mediaLideranca === null) {
      return 0;
    }
    
    return Number(Math.abs(mediaAuto - mediaLideranca).toFixed(2));
  }

  getDesvioMediaClass(cargo: CargoCockpit): string {
    const desvio = this.getDesvioMedia(cargo);
    
    if (desvio === 0) {
      return 'bg-success text-dark'; // Verde
    } else if (desvio < 1) {
      return 'bg-warning text-dark'; // Amarelo para desvios menores que 1
    } else if (desvio < 2) {
      return 'bg-warning text-dark'; // Amarelo para desvios entre 1 e 2
    } else {
      return 'bg-danger text-dark'; // Vermelho (2 ou mais)
    }
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
