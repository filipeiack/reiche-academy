import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicadorCockpit } from '@core/interfaces/cockpit-pilares.interface';
import { GestaoIndicadoresComponent } from '../gestao-indicadores/gestao-indicadores.component';
import { EdicaoValoresMensaisComponent } from '../edicao-valores-mensais/edicao-valores-mensais.component';

/**
 * Container que orquestra:
 * - Gestão de Indicadores (CRUD)
 * - Edição de Valores Mensais (Meta/Realizado)
 *
 * Conforme ADR-006: Arquitetura de Componentes da Matriz de Indicadores
 */
@Component({
  selector: 'app-matriz-indicadores',
  standalone: true,
  imports: [CommonModule, GestaoIndicadoresComponent, EdicaoValoresMensaisComponent],
  templateUrl: './matriz-indicadores.component.html',
  styleUrl: './matriz-indicadores.component.scss',
})
export class MatrizIndicadoresComponent implements OnInit {
  @Input() cockpitId!: string;

  @ViewChild('valoresMensais') valoresMensaisComponent?: EdicaoValoresMensaisComponent;

  ngOnInit(): void {
    // Componentes filhos gerenciam seu próprio carregamento
  }

  /**
   * Handler: Indicador criado (emitido por gestao-indicadores)
   * Recarrega edição de valores para incluir novo indicador
   */
  onIndicadorCriado(indicador: IndicadorCockpit): void {
    console.log('Indicador criado:', indicador.nome);
    this.reloadValoresMensais();
  }

  /**
   * Handler: Indicador removido (emitido por gestao-indicadores)
   * Recarrega edição de valores para remover indicador
   */
  onIndicadorRemovido(indicadorId: string): void {
    console.log('Indicador removido:', indicadorId);
    this.reloadValoresMensais();
  }

  /**
   * Recarrega componente de edição de valores mensais
   */
  private reloadValoresMensais(): void {
    if (this.valoresMensaisComponent) {
      this.valoresMensaisComponent.reload();
    }
  }
}