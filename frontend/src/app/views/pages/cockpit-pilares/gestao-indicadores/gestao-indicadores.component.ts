import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { UsersService } from '@core/services/users.service';
import {
  IndicadorCockpit,
  TipoMedidaIndicador,
  DirecaoIndicador,
} from '@core/interfaces/cockpit-pilares.interface';
import { Usuario } from '@core/models/auth.model';
import { TranslatePipe } from '@core/pipes/translate.pipe';
import { IndicadorFormDrawerComponent } from './indicador-form-drawer/indicador-form-drawer.component';

@Component({
  selector: 'app-gestao-indicadores',
  standalone: true,
  imports: [CommonModule, DragDropModule, TranslatePipe],
  templateUrl: './gestao-indicadores.component.html',
  styleUrl: './gestao-indicadores.component.scss',
})
export class GestaoIndicadoresComponent implements OnInit {
  @Input() cockpitId!: string;
  @Output() indicadorCriado = new EventEmitter<IndicadorCockpit>();
  @Output() indicadorRemovido = new EventEmitter<string>();
  @Output() indicadorAtualizado = new EventEmitter<void>();

  private cockpitService = inject(CockpitPilaresService);
  private usersService = inject(UsersService);
  private offcanvasService = inject(NgbOffcanvas);

  empresaId: string | null = null;

  indicadores: IndicadorCockpit[] = [];
  usuarios: Usuario[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadIndicadores();
  }

  private loadIndicadores(): void {
    this.loading = true;

    this.cockpitService.getCockpitById(this.cockpitId).subscribe({
      next: (cockpit) => {
        this.indicadores = cockpit.indicadores || [];
        this.empresaId = cockpit.pilarEmpresa?.empresaId || null;
        this.loading = false;
        
        // Carregar usuários após obter empresaId
        this.loadUsuarios();
      },
      error: (err) => {
        console.error('Erro ao carregar indicadores:', err);
        this.showToast('Erro ao carregar indicadores', 'error');
        this.loading = false;
      },
    });
  }

  private loadUsuarios(): void {
    if (!this.empresaId) {
      console.error('empresaId não definido');
      return;
    }

    this.usersService.getAll().subscribe({
      next: (usuarios: Usuario[]) => {
        // Filtrar usuários ativos da empresa atual com perfis válidos
        const perfisPermitidos = ['GESTOR', 'COLABORADOR', 'LEITURA'];
        this.usuarios = usuarios.filter(u =>
          u.empresaId === this.empresaId &&
          (!!u.ativo) &&
          (!!u.perfil?.codigo && perfisPermitidos.includes(u.perfil.codigo))
        );
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar usuários:', err);
      },
    });
  }

  /**
   * Obter nome do responsável por ID (para exibição na tabela)
   */
  getResponsavelNome(responsavelId: string | null | undefined): string {
    if (!responsavelId) return '-';
    const usuario = this.usuarios.find((u) => u.id === responsavelId);
    return usuario?.nome || '-';
  }

  /**
   * Obter label do tipo de medida
   */
  getTipoMedidaLabel(tipo: TipoMedidaIndicador | null): string {
    switch (tipo) {
      case TipoMedidaIndicador.REAL: return 'R$';
      case TipoMedidaIndicador.QUANTIDADE: return 'Qtde';
      case TipoMedidaIndicador.TEMPO: return 'Tempo';
      case TipoMedidaIndicador.PERCENTUAL: return '%';
      default: return '-';
    }
  }

  /**
   * Obter badge do status de medição
   */
  getStatusMedicaoBadge(status: string): { label: string; class: string } {
    switch (status) {
      case 'MEDIDO_CONFIAVEL':
        return { label: 'Medido e confiável', class: 'bg-success' };
      case 'MEDIDO_NAO_CONFIAVEL':
        return { label: 'Medido, não confiável', class: 'bg-warning' };
      case 'NAO_MEDIDO':
        return { label: 'Não é medido ainda', class: 'bg-danger' };
      default:
        return { label: 'N/A', class: 'bg-secondary' };
    }
  }

  /**
   * Abrir drawer para criar novo indicador
   */
  abrirDrawerNovo(): void {
    const offcanvasRef = this.offcanvasService.open(IndicadorFormDrawerComponent, {
      position: 'end',
      backdrop: 'static',
      panelClass: 'w-40'
    });

    const component = offcanvasRef.componentInstance as IndicadorFormDrawerComponent;
    component.cockpitId = this.cockpitId;
    component.empresaId = this.empresaId!;
    component.usuarios = this.usuarios;
    component.indicadorSalvo.subscribe((indicador: IndicadorCockpit) => {
      this.indicadores.push(indicador);
      this.indicadorCriado.emit(indicador);
    });
  }

  /**
   * Abrir drawer para editar indicador existente
   */
  editarIndicador(indicador: IndicadorCockpit): void {
    const offcanvasRef = this.offcanvasService.open(IndicadorFormDrawerComponent, {
      position: 'end',
      backdrop: 'static',
      panelClass: 'w-40'
    });

    const component = offcanvasRef.componentInstance as IndicadorFormDrawerComponent;
    component.cockpitId = this.cockpitId;
    component.empresaId = this.empresaId!;
    component.usuarios = this.usuarios;
    component.indicadorParaEditar = indicador;
    component.indicadorSalvo.subscribe((indicadorAtualizado: IndicadorCockpit) => {
      const index = this.indicadores.findIndex(i => i.id === indicadorAtualizado.id);
      if (index >= 0) {
        this.indicadores[index] = indicadorAtualizado;
      }
      this.indicadorAtualizado.emit();
    });
  }

  /**
   * Remover indicador
   */
  async deleteIndicador(indicador: IndicadorCockpit): Promise<void> {
    const result = await Swal.fire({
      title: 'Remover Indicador',
      text: `Deseja remover o indicador "${indicador.nome}"? Todos os dados mensais serão perdidos.`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    this.cockpitService.deleteIndicador(indicador.id).subscribe({
      next: () => {
        // Remover da lista
        const index = this.indicadores.findIndex((i) => i.id === indicador.id);
        if (index > -1) {
          this.indicadores.splice(index, 1);
        }

        // Reajustar ordem
        this.indicadores.forEach((ind, idx) => {
          ind.ordem = idx + 1;
        });

        this.showToast('Indicador removido com sucesso', 'success');
        this.indicadorRemovido.emit(indicador.id);
      },
      error: (err) => {
        console.error('Erro ao remover indicador:', err);
        this.showToast('Erro ao remover indicador', 'error');
      },
    });
  }

  /**
   * Drag & Drop para reordenar
   */
  onDrop(event: CdkDragDrop<IndicadorCockpit[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.indicadores, event.previousIndex, event.currentIndex);

      // Atualizar campo ordem
      this.indicadores.forEach((ind, idx) => {
        ind.ordem = idx + 1;
      });

      // Salvar nova ordem automaticamente
      this.saveOrdem();
    }
  }

  /**
   * Salvar nova ordem
   */
  private async saveOrdem(): Promise<void> {
    try {
      const updatePromises = this.indicadores
        .filter(ind => ind.id)
        .map(ind => 
          this.cockpitService.updateIndicador(ind.id, { ordem: ind.ordem }).toPromise()
        );

      await Promise.all(updatePromises);
      
      this.showToast('Ordem dos indicadores atualizada', 'success');
      this.indicadorAtualizado.emit();
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      this.showToast('Erro ao reordenar indicadores', 'error');
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
