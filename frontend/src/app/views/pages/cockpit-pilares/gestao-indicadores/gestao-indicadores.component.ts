import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { UsersService } from '@core/services/users.service';
import {
  IndicadorCockpit,
  TipoMedidaIndicador,
  StatusMedicaoIndicador,
  DirecaoIndicador,
} from '@core/interfaces/cockpit-pilares.interface';
import { Usuario } from '@core/models/auth.model';
import { TranslatePipe } from '@core/pipes/translate.pipe';
import { DescricaoIndicadorModalComponent } from './descricao-indicador-modal/descricao-indicador-modal.component';

interface IndicadorExtended extends IndicadorCockpit {
  isEditing?: boolean;
  isNew?: boolean;
  saveStatus?: 'saving' | 'saved' | 'error' | null;
}

@Component({
  selector: 'app-gestao-indicadores',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, NgSelectModule, TranslatePipe, DescricaoIndicadorModalComponent],
  templateUrl: './gestao-indicadores.component.html',
  styleUrl: './gestao-indicadores.component.scss',
})
export class GestaoIndicadoresComponent implements OnInit, OnDestroy {
  @Input() cockpitId!: string;
  @Output() indicadorCriado = new EventEmitter<IndicadorCockpit>();
  @Output() indicadorRemovido = new EventEmitter<string>();
  @ViewChild(DescricaoIndicadorModalComponent) descricaoModal!: DescricaoIndicadorModalComponent;

  private cockpitService = inject(CockpitPilaresService);
  private usersService = inject(UsersService);
  private modalService = inject(NgbModal);

  indicadores: IndicadorExtended[] = [];
  usuarios: Usuario[] = [];
  loading = false;
  editingRowId: string | null = null;

  // Auto-save
  private autoSaveSubject = new Subject<{
    indicador: IndicadorExtended;
    field: string;
  }>();

  // Enums para template
  tiposMedida = [
    { value: TipoMedidaIndicador.REAL, label: 'R$ (Reais)' },
    { value: TipoMedidaIndicador.QUANTIDADE, label: 'Quantidade' },
    { value: TipoMedidaIndicador.TEMPO, label: 'Tempo' },
    { value: TipoMedidaIndicador.PERCENTUAL, label: '% (Percentual)' },
  ];

  statusMedicao = [
    { value: StatusMedicaoIndicador.NAO_MEDIDO, label: 'Não Medido' },
    {
      value: StatusMedicaoIndicador.MEDIDO_NAO_CONFIAVEL,
      label: 'Não Confiável',
    },
    { value: StatusMedicaoIndicador.MEDIDO_CONFIAVEL, label: 'Confiável' },
  ];

  ngOnInit(): void {
    this.loadIndicadores();
    this.loadUsuarios();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.autoSaveSubject.complete();
  }

  private setupAutoSave(): void {
    this.autoSaveSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(
          (prev, curr) =>
            prev.indicador.id === curr.indicador.id && prev.field === curr.field
        )
      )
      .subscribe(({ indicador }) => {
        this.saveIndicador(indicador);
      });
  }

  private loadIndicadores(): void {
    this.loading = true;

    this.cockpitService.getCockpitById(this.cockpitId).subscribe({
      next: (cockpit) => {
        this.indicadores = (cockpit.indicadores || []) as IndicadorExtended[];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar indicadores:', err);
        alert('Erro ao carregar indicadores');
        this.loading = false;
      },
    });
  }

  private loadUsuarios(): void {
    this.usersService.getAll().subscribe({
      next: (usuarios: Usuario[]) => {
        this.usuarios = usuarios;
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar usuários:', err);
      },
    });
  }

  /**
   * Obter nome do responsável por ID
   */
  getResponsavelNome(responsavelId: string | null | undefined): string {
    if (!responsavelId) return '-';
    const usuario = this.usuarios.find((u) => u.id === responsavelId);
    return usuario?.nome || '-';
  }

  /**
   * Adicionar nova linha vazia ao final
   */
  addNewRow(): void {
    // Desabilitar edição de linha anterior
    if (this.editingRowId) {
      const previous = this.indicadores.find(
        (i) => i.id === this.editingRowId || 'new-' + i.ordem === this.editingRowId
      );
      if (previous) {
        previous.isEditing = false;
      }
    }

    const newIndicador: IndicadorExtended = {
      id: '',
      nome: '',
      descricao: null,
      tipoMedida: null as any,
      statusMedicao: StatusMedicaoIndicador.NAO_MEDIDO,
      responsavelMedicaoId: null,
      melhor: DirecaoIndicador.MAIOR,
      ordem: this.indicadores.length + 1,
      ativo: true,
      isEditing: true,
      isNew: true,
      saveStatus: null,
    } as any;

    this.indicadores.push(newIndicador);
    this.editingRowId = 'new-' + newIndicador.ordem;

    // Auto-focus no campo nome
    setTimeout(() => {
      const input = document.getElementById(`nome-${newIndicador.ordem}`);
      input?.focus();
    }, 100);
  }

  /**
   * Habilitar edição de linha existente
   */
  enableEdit(indicador: IndicadorExtended): void {
    // Salvar linha anterior se houver
    if (this.editingRowId && this.editingRowId !== indicador.id) {
      const previous = this.indicadores.find((i) => i.id === this.editingRowId);
      if (previous) {
        previous.isEditing = false;
      }
    }

    indicador.isEditing = true;
    this.editingRowId = indicador.id;
  }

  /**
   * Desabilitar edição (confirmar)
   */
  disableEdit(indicador: IndicadorExtended): void {
    if (this.isValidForSave(indicador)) {
      indicador.isEditing = false;
      this.editingRowId = null;
    } else {
      alert('Preencha os campos obrigatórios: Nome, Tipo e Melhor');
    }
  }

  /**
   * Validação mínima para salvar
   */
  isValidForSave(indicador: IndicadorExtended): boolean {
    return !!(indicador.nome?.trim() && indicador.tipoMedida && indicador.melhor);
  }

  /**
   * Auto-save ao perder foco
   */
  onCellBlur(indicador: IndicadorExtended, field: string): void {
    if (!this.isValidForSave(indicador)) {
      return; // Não salva se inválido
    }

    // Envia para subject (debounce 1000ms)
    this.autoSaveSubject.next({ indicador, field });
  }

  /**
   * Salvar indicador (CREATE ou UPDATE)
   */
  private async saveIndicador(indicador: IndicadorExtended): Promise<void> {
    indicador.saveStatus = 'saving';

    const payload = {
      nome: indicador.nome,
      descricao: indicador.descricao,
      tipoMedida: indicador.tipoMedida,
      statusMedicao: indicador.statusMedicao,
      responsavelMedicaoId: indicador.responsavelMedicaoId,
      melhor: indicador.melhor,
      ordem: indicador.ordem,
    };

    try {
      if (indicador.isNew) {
        // POST /cockpits/:id/indicadores
        this.cockpitService
          .createIndicador(this.cockpitId, payload)
          .subscribe({
            next: (created) => {
              // Atualizar com dados do backend
              Object.assign(indicador, created);
              indicador.isNew = false;
              indicador.isEditing = false;
              indicador.saveStatus = 'saved';
              this.editingRowId = null;

              // Emitir evento para container
              this.indicadorCriado.emit(created);

              setTimeout(() => (indicador.saveStatus = null), 2000);
            },
            error: (err) => {
              console.error('Erro ao criar indicador:', err);
              indicador.saveStatus = 'error';
              alert('Erro ao salvar indicador');
            },
          });
      } else {
        // PATCH /indicadores/:id
        this.cockpitService.updateIndicador(indicador.id, payload).subscribe({
          next: () => {
            indicador.saveStatus = 'saved';
            setTimeout(() => (indicador.saveStatus = null), 2000);
          },
          error: (err) => {
            console.error('Erro ao atualizar indicador:', err);
            indicador.saveStatus = 'error';
            alert('Erro ao salvar indicador');
          },
        });
      }
    } catch (error) {
      console.error('Erro inesperado ao salvar:', error);
      indicador.saveStatus = 'error';
    }
  }

  /**
   * Toggle Melhor (Maior ↔ Menor)
   */
  toggleMelhor(indicador: IndicadorExtended): void {
    indicador.melhor =
      indicador.melhor === DirecaoIndicador.MAIOR
        ? DirecaoIndicador.MENOR
        : DirecaoIndicador.MAIOR;
    this.onCellBlur(indicador, 'melhor');
  }

  /**
   * Remover indicador
   */
  deleteIndicador(indicador: IndicadorExtended): void {
    const confirmado = confirm(
      `Remover indicador "${indicador.nome}"?\n\nTodos os dados mensais serão perdidos.`
    );

    if (!confirmado) return;

    // Se for novo (não salvo ainda), apenas remove da lista
    if (indicador.isNew) {
      const index = this.indicadores.indexOf(indicador);
      if (index > -1) {
        this.indicadores.splice(index, 1);
      }
      return;
    }

    // DELETE /indicadores/:id
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

        // Emitir evento para container
        this.indicadorRemovido.emit(indicador.id);
      },
      error: (err) => {
        console.error('Erro ao remover indicador:', err);
        alert('Erro ao remover indicador');
      },
    });
  }

  /**
   * Drag & Drop para reordenar
   */
  onDrop(event: CdkDragDrop<IndicadorExtended[]>): void {
    moveItemInArray(this.indicadores, event.previousIndex, event.currentIndex);

    // Atualizar campo ordem
    this.indicadores.forEach((ind, idx) => {
      ind.ordem = idx + 1;
    });

    // Salvar nova ordem (batch update)
    this.saveOrdem();
  }

  /**
   * Salvar nova ordem (batch update)
   */
  private saveOrdem(): void {
    const ordemPayload = this.indicadores.map((ind) => ({
      id: ind.id,
      ordem: ind.ordem,
    }));

    // TODO: Implementar endpoint updateIndicadoresOrdem no backend
    console.log('Ordem atualizada (mock):', ordemPayload);
    // this.cockpitService
    //   .updateIndicadoresOrdem(this.cockpitId, ordemPayload)
    //   .subscribe({
    //     next: () => {
    //       console.log('Ordem atualizada com sucesso');
    //     },
    //     error: (err: unknown) => {
    //       console.error('Erro ao atualizar ordem:', err);
    //       alert('Erro ao reordenar indicadores');
    //     },
    //   });
  }

  /**
   * Navegação com Tab/Enter (Excel-like)
   */
  onKeyDown(
    event: KeyboardEvent,
    rowIndex: number,
    field: string
  ): void {
    const fields = ['nome', 'tipoMedida', 'statusMedicao', 'responsavel', 'melhor'];
    const currentFieldIndex = fields.indexOf(field);

    if (event.key === 'Tab' && !event.shiftKey) {
      // Tab → próximo campo
      event.preventDefault();

      if (currentFieldIndex < fields.length - 1) {
        // Próximo campo na mesma linha
        const nextField = fields[currentFieldIndex + 1];
        const nextInput = document.getElementById(`${nextField}-${rowIndex}`);
        nextInput?.focus();
      } else if (rowIndex < this.indicadores.length - 1) {
        // Primeira célula da próxima linha
        const nextInput = document.getElementById(`nome-${rowIndex + 1}`);
        nextInput?.focus();
      }
    } else if (event.key === 'Tab' && event.shiftKey) {
      // Shift+Tab → campo anterior
      event.preventDefault();

      if (currentFieldIndex > 0) {
        // Campo anterior na mesma linha
        const prevField = fields[currentFieldIndex - 1];
        const prevInput = document.getElementById(`${prevField}-${rowIndex}`);
        prevInput?.focus();
      } else if (rowIndex > 0) {
        // Último campo da linha anterior
        const prevInput = document.getElementById(`melhor-${rowIndex - 1}`);
        prevInput?.focus();
      }
    } else if (event.key === 'Enter') {
      // Enter → próxima linha, mesmo campo
      event.preventDefault();

      if (rowIndex < this.indicadores.length - 1) {
        const nextInput = document.getElementById(`${field}-${rowIndex + 1}`);
        nextInput?.focus();
      }
    }
  }

  /**
   * Abrir modal de descrição
   */
  openDescricaoModal(indicador: IndicadorExtended): void {
    this.descricaoModal.open(indicador.descricao || '', indicador.nome);
    
    // Subscribe to the modal save event (will auto-unsubscribe after first emission)
    this.descricaoModal.descricaoSalva.pipe(
      take(1)
    ).subscribe((descricao: string) => {
      indicador.descricao = descricao || undefined;
      this.onCellBlur(indicador, 'descricao');
    });
  }
}
