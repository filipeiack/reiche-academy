import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import {
  ProcessoPrioritario,
  StatusProcesso,
  UpdateProcessoPrioritarioDto,
} from '@core/interfaces/cockpit-pilares.interface';

@Component({
  selector: 'app-matriz-processos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matriz-processos.component.html',
  styleUrl: './matriz-processos.component.scss',
})
export class MatrizProcessosComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cockpitId!: string;
  @Input() processos: ProcessoPrioritario[] = [];

  private cockpitService = inject(CockpitPilaresService);

  // Auto-save
  private autoSaveSubject = new Subject<{ processoId: string; status: StatusProcesso }>();
  private autoSaveSubscription: Subscription | null = null;
  savingCount = 0;
  lastSaveTime: Date | null = null;

  // StatusProcesso enum para template
  StatusProcesso = {
    PENDENTE: 'PENDENTE' as StatusProcesso,
    EM_ANDAMENTO: 'EM_ANDAMENTO' as StatusProcesso,
    CONCLUIDO: 'CONCLUIDO' as StatusProcesso,
  };

  ngOnInit(): void {
    this.setupAutoSave();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Componente recebe processos via Input, não precisa recarregar
    // A atualização é automática via data binding
  }

  ngOnDestroy(): void {
    this.autoSaveSubscription?.unsubscribe();
  }

  private setupAutoSave(): void {
    this.autoSaveSubscription = this.autoSaveSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged((prev, curr) =>
          prev.processoId === curr.processoId && prev.status === curr.status
        )
      )
      .subscribe(({ processoId, status }) => {
        this.saveStatus(processoId, status);
      });
  }

  onStatusChange(processoId: string, newStatus: StatusProcesso): void {
    // Atualiza localmente (MVP: apenas statusMapeamento exibido, mas ambos são sincronizados)
    const processo = this.processos.find((p) => p.id === processoId);
    if (processo) {
      processo.statusMapeamento = newStatus;
      processo.statusTreinamento = newStatus;
    }

    // Enfileira para auto-save
    this.autoSaveSubject.next({ processoId, status: newStatus });
  }

  private saveStatus(processoId: string, status: StatusProcesso): void {
    this.savingCount++;

    // MVP Fase 1: Ambos status (mapeamento e treinamento) compartilham o mesmo valor
    const dto: UpdateProcessoPrioritarioDto = {
      statusMapeamento: status,
      statusTreinamento: status,
    };

    this.cockpitService
      .updateProcessoPrioritario(processoId, dto)
      .subscribe({
        next: () => {
          this.savingCount--;
          this.lastSaveTime = new Date();
        },
        error: (err: unknown) => {
          console.error('Erro ao salvar status do processo:', err);
          this.savingCount--;
          // TODO: Implementar retry ou notificação de erro
        },
      });
  }

  getStatusBadgeClass(status: StatusProcesso): string {
    switch (status) {
      case 'PENDENTE':
        return 'bg-secondary';
      case 'EM_ANDAMENTO':
        return 'bg-primary';
      case 'CONCLUIDO':
        return 'bg-success';
      default:
        return 'bg-secondary';
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
        return 'Pendente';
      case 'EM_ANDAMENTO':
        return 'Em Andamento';
      case 'CONCLUIDO':
        return 'Concluído';
      default:
        return '';
    }
  }
}
