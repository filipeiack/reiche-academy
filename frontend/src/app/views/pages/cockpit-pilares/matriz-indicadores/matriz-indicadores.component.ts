import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import {
  CockpitPilar,
  IndicadorCockpit,
  IndicadorMensal,
  DirecaoIndicador,
  StatusMedicaoIndicador,
} from '@core/interfaces/cockpit-pilares.interface';

@Component({
  selector: 'app-matriz-indicadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matriz-indicadores.component.html',
  styleUrl: './matriz-indicadores.component.scss',
})
export class MatrizIndicadoresComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cockpitId!: string;

  private cockpitService = inject(CockpitPilaresService);
  private autoSaveSubject = new Subject<{
    indicadorMensalId: string;
    campo: 'meta' | 'realizado';
    valor: number | null;
  }>();

  indicadores: IndicadorCockpit[] = [];
  loading = false;
  savingCount = 0;
  lastSaveTime: Date | null = null;

  // Cache de valores em edição
  private valoresCache = new Map<string, { meta?: number; realizado?: number }>();

  ngOnInit(): void {
    this.setupAutoSave();
    this.loadIndicadores();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recarregar quando cockpitId mudar
    if (changes['cockpitId'] && !changes['cockpitId'].firstChange) {
      this.loadIndicadores();
    }
  }

  ngOnDestroy(): void {
    this.autoSaveSubject.complete();
  }

  private setupAutoSave(): void {
    this.autoSaveSubject
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((change) => {
        this.executeSave(change.indicadorMensalId, change.campo, change.valor);
      });
  }

  private loadIndicadores(): void {
    this.loading = true;

    this.cockpitService.getCockpitById(this.cockpitId).subscribe({
      next: (cockpit: CockpitPilar) => {
        this.indicadores = cockpit.indicadores || [];
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar indicadores:', err);
        this.loading = false;
      },
    });
  }

  onValorChange(
    indicadorMensal: IndicadorMensal,
    campo: 'meta' | 'realizado',
    event: Event
  ): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value ? parseFloat(input.value) : null;

    // Atualizar cache local
    const cacheKey = indicadorMensal.id;
    if (!this.valoresCache.has(cacheKey)) {
      this.valoresCache.set(cacheKey, {});
    }
    const cached = this.valoresCache.get(cacheKey)!;
    cached[campo] = valor ?? undefined;

    // Agendar auto-save
    this.autoSaveSubject.next({
      indicadorMensalId: indicadorMensal.id,
      campo,
      valor,
    });
  }

  private executeSave(
    indicadorMensalId: string,
    campo: 'meta' | 'realizado',
    valor: number | null
  ): void {
    this.savingCount++;

    // Encontrar o indicador e mes
    let indicadorId: string | null = null;
    let mes: IndicadorMensal | null = null;

    for (const ind of this.indicadores) {
      const found = ind.mesesIndicador?.find((m: IndicadorMensal) => m.id === indicadorMensalId);
      if (found) {
        indicadorId = ind.id;
        mes = found;
        break;
      }
    }

    if (!indicadorId || !mes) {
      console.error('Mês não encontrado:', indicadorMensalId);
      this.savingCount--;
      return;
    }

    // Preparar payload com cache
    const cached = this.valoresCache.get(indicadorMensalId) || {};
    const payload = {
      valores: [
        {
          mes: mes.mes,
          ano: mes.ano,
          meta: cached.meta ?? mes.meta ?? undefined,
          realizado: cached.realizado ?? mes.realizado ?? undefined,
        },
      ],
    };

    this.cockpitService.updateValoresMensais(indicadorId, payload).subscribe({
      next: () => {
        this.savingCount--;
        this.lastSaveTime = new Date();
        this.valoresCache.delete(indicadorMensalId);
      },
      error: (err: unknown) => {
        console.error('Erro ao salvar valor mensal:', err);
        alert('Erro ao salvar. Tente novamente.');
        this.savingCount--;
      },
    });
  }

  calcularDesvio(indicador: IndicadorCockpit, mes: IndicadorMensal): number {
    if (!mes.meta || !mes.realizado) return 0;

    if (indicador.melhor === DirecaoIndicador.MAIOR) {
      return ((mes.realizado - mes.meta) / mes.meta) * 100;
    } else {
      return ((mes.meta - mes.realizado) / mes.meta) * 100;
    }
  }

  calcularStatus(
    indicador: IndicadorCockpit,
    mes: IndicadorMensal
  ): 'success' | 'warning' | 'danger' | null {
    if (!mes.meta || !mes.realizado) return null;

    const percentual = (mes.realizado / mes.meta) * 100;

    if (indicador.melhor === DirecaoIndicador.MAIOR) {
      if (percentual >= 100) return 'success';
      if (percentual >= 80) return 'warning';
      return 'danger';
    } else {
      // Para MENOR, quanto menor melhor
      if (percentual <= 100) return 'success';
      if (percentual <= 120) return 'warning';
      return 'danger';
    }
  }

  getMesesOrdenados(indicador: IndicadorCockpit): IndicadorMensal[] {
    if (!indicador.mesesIndicador) return [];
    return indicador.mesesIndicador
      .filter((m: IndicadorMensal) => m.mes !== null)
      .sort((a: IndicadorMensal, b: IndicadorMensal) => (a.mes! - b.mes!));
  }

  getNomeMes(mes: number): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses[mes - 1] || '';
  }

  novoIndicador(): void {
    // TODO: Implementar modal de criação de indicador
    console.log('Criar novo indicador');
    alert('Funcionalidade "Criar Indicador" será implementada em breve.');
  }

  editarIndicador(indicador: IndicadorCockpit): void {
    // TODO: Implementar modal de edição de indicador
    console.log('Editar indicador:', indicador);
    alert('Funcionalidade "Editar Indicador" será implementada em breve.');
  }

  excluirIndicador(indicador: IndicadorCockpit): void {
    if (!confirm(`Tem certeza que deseja excluir o indicador "${indicador.nome}"?`)) {
      return;
    }

    // TODO: Implementar soft delete no backend
    console.log('Excluir indicador:', indicador);
    alert('Funcionalidade "Excluir Indicador" será implementada em breve.');
  }
}
