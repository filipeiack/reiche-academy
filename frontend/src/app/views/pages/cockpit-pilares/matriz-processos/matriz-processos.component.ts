import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import { SaveFeedbackService } from '@core/services/save-feedback.service';
import {
  ProcessoPrioritario,
  StatusProcesso,
  UpdateProcessoPrioritarioDto,
} from '@core/interfaces/cockpit-pilares.interface';
import { NgbOffcanvas, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@core/pipes/translate.pipe';
import { OFFCANVAS_SIZE } from '@core/constants/ui.constants';
import { ProcessoFluxogramaDrawerComponent } from './processo-fluxograma-drawer/processo-fluxograma-drawer.component';

@Component({
  selector: 'app-matriz-processos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, NgbTooltipModule, TranslatePipe],
  templateUrl: './matriz-processos.component.html',
  styleUrl: './matriz-processos.component.scss',
})
export class MatrizProcessosComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cockpitId!: string;

  private cockpitService = inject(CockpitPilaresService);
  private saveFeedbackService = inject(SaveFeedbackService);
  private offcanvasService = inject(NgbOffcanvas);

  processos: ProcessoPrioritario[] = [];

  // Opções para ng-select
  statusOptions = [
    { value: StatusProcesso.PENDENTE, label: 'PENDENTE' },
    { value: StatusProcesso.EM_ANDAMENTO, label: 'EM ANDAMENTO' },
    { value: StatusProcesso.CONCLUIDO, label: 'CONCLUÍDO' }
  ];

  // Auto-save
  private autoSaveSubject = new Subject<{ 
    processoId: string; 
    statusMapeamento: StatusProcesso | null;
    statusTreinamento: StatusProcesso | null;
  }>();
  private autoSaveSubscription: Subscription | null = null;
  private savingCount = 0;

  // StatusProcesso enum para template
  StatusProcesso = {
    PENDENTE: 'PENDENTE' as StatusProcesso,
    EM_ANDAMENTO: 'EM_ANDAMENTO' as StatusProcesso,
    CONCLUIDO: 'CONCLUIDO' as StatusProcesso,
  };

  ngOnInit(): void {
    this.setupAutoSave();
    this.loadProcessos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recarregar quando cockpitId mudar
    if (changes['cockpitId'] && !changes['cockpitId'].firstChange) {
      this.loadProcessos();
    }
  }

  ngOnDestroy(): void {
    this.autoSaveSubscription?.unsubscribe();
  }

  private loadProcessos(): void {
    if (!this.cockpitId) return;

    this.cockpitService.getProcessosPrioritarios(this.cockpitId).subscribe({
      next: (processos) => {
        this.processos = processos;
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar processos:', err);
        this.processos = [];
      },
    });
  }

  private setupAutoSave(): void {
    this.autoSaveSubscription = this.autoSaveSubject
      .pipe(
        debounceTime(environment.debounceTime),
        distinctUntilChanged((prev, curr) =>
          prev.processoId === curr.processoId && 
          prev.statusMapeamento === curr.statusMapeamento &&
          prev.statusTreinamento === curr.statusTreinamento
        )
      )
      .subscribe(({ processoId, statusMapeamento, statusTreinamento }) => {
        this.saveStatus(processoId, statusMapeamento, statusTreinamento);
      });
  }

  onStatusMapeamentoChange(processoId: string, newStatus: StatusProcesso | null): void {
    const processo = this.processos.find((p) => p.id === processoId);
    if (processo) {
      processo.statusMapeamento = newStatus;
    }

    this.autoSaveSubject.next({ 
      processoId, 
      statusMapeamento: newStatus,
      statusTreinamento: processo?.statusTreinamento || null
    });
  }

  onStatusTreinamentoChange(processoId: string, newStatus: StatusProcesso | null): void {
    const processo = this.processos.find((p) => p.id === processoId);
    if (processo) {
      processo.statusTreinamento = newStatus;
    }

    this.autoSaveSubject.next({ 
      processoId, 
      statusMapeamento: processo?.statusMapeamento || null,
      statusTreinamento: newStatus
    });
  }

  private saveStatus(
    processoId: string, 
    statusMapeamento: StatusProcesso | null,
    statusTreinamento: StatusProcesso | null
  ): void {
    this.savingCount++;
    if (this.savingCount === 1) {
      this.saveFeedbackService.startSaving('Status de processos');
    }

    const dto: UpdateProcessoPrioritarioDto = {
      statusMapeamento,
      statusTreinamento,
    };

    this.cockpitService
      .updateProcessoPrioritario(processoId, dto)
      .subscribe({
        next: () => {
          this.savingCount--;
          if (this.savingCount === 0) {
            this.saveFeedbackService.completeSaving();
          }
        },
        error: (err: unknown) => {
          console.error('Erro ao salvar status do processo:', err);
          this.savingCount--;
          if (this.savingCount === 0) {
            this.saveFeedbackService.reset();
          }
        },
      });
  }

  getStatusBadgeClass(status: StatusProcesso): string {
    switch (status) {
      case 'PENDENTE':
        return 'bg-danger';
      case 'EM_ANDAMENTO':
        return 'bg-warning';
      case 'CONCLUIDO':
        return 'bg-success';
      default:
        return 'bg-primary';
    }
  }

  getStatusIcon(status: StatusProcesso): string {
    switch (status) {
      case 'PENDENTE':
        return 'bi-clock';
      case 'EM_ANDAMENTO':
        return 'bi-hourglass-split';
      case 'CONCLUIDO':
        return 'bi-check-circle';
      default:
        return 'bi-question-circle';
    }
  }

  getStatusLabel(status: StatusProcesso): string {
    switch (status) {
      case 'PENDENTE':
        return 'PENDENTE';
      case 'EM_ANDAMENTO':
        return 'EM ANDAMENTO';
      case 'CONCLUIDO':
        return 'CONCLUÍDO';
      default:
        return '';
    }
  }

  getNotaClass(nota: number | null): string {
    if (nota === null || nota === undefined) {
      return '';
    }
    
    if (nota >= 1 && nota <= 5) {
      return 'bg-danger';
    } else if (nota >= 6 && nota <= 8) {
      return 'bg-warning';
    } else if (nota >= 9 && nota <= 10) {
      return 'bg-success';
    }
    
    return '';
  }

  abrirFluxograma(processo: ProcessoPrioritario): void {
    const offcanvasRef = this.offcanvasService.open(
      ProcessoFluxogramaDrawerComponent,
      {
        position: 'end',
        backdrop: 'static',
        panelClass: OFFCANVAS_SIZE.MEDIUM,
      },
    );

    const component =
      offcanvasRef.componentInstance as ProcessoFluxogramaDrawerComponent;
    component.processo = processo;
    component.fluxogramaAtualizado.subscribe((totalAcoes: number) => {
      if (!processo._count) {
        processo._count = { fluxogramaAcoes: 0 };
      }
      processo._count.fluxogramaAcoes = totalAcoes;
    });
  }
}
