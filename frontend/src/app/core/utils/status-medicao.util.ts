import { StatusMedicaoIndicador } from '../interfaces/cockpit-pilares.interface';

export interface StatusMedicaoDisplay {
  label: string;
  badgeClass: string;
  icon?: string;
}

/**
 * Utilitário para padronizar exibição de Status de Medição
 */
export class StatusMedicaoUtil {
  private static readonly STATUS_MAP: Record<StatusMedicaoIndicador, StatusMedicaoDisplay> = {
    [StatusMedicaoIndicador.MEDIDO_CONFIAVEL]: {
      label: 'Medido e confiável',
      badgeClass: 'bg-success',
      icon: 'bi-check-circle-fill'
    },
    [StatusMedicaoIndicador.MEDIDO_NAO_CONFIAVEL]: {
      label: 'Medido, mas não é confiável.',
      badgeClass: 'bg-warning',
      icon: 'bi-exclamation-triangle-fill'
    },
    [StatusMedicaoIndicador.NAO_MEDIDO]: {
      label: 'Não é medido',
      badgeClass: 'bg-danger',
      icon: 'bi-x-circle-fill'
    }
  };

  /**
   * Retorna informações de exibição para um status de medição
   */
  static getDisplay(status: StatusMedicaoIndicador): StatusMedicaoDisplay {
    return this.STATUS_MAP[status] || {
      label: 'Status desconhecido',
      badgeClass: 'bg-secondary',
      icon: 'bi-question-circle'
    };
  }

  /**
   * Retorna apenas o label do status
   */
  static getLabel(status: StatusMedicaoIndicador): string {
    return this.getDisplay(status).label;
  }

  /**
   * Retorna apenas a classe do badge
   */
  static getBadgeClass(status: StatusMedicaoIndicador): string {
    return this.getDisplay(status).badgeClass;
  }

  /**
   * Retorna apenas o ícone
   */
  static getIcon(status: StatusMedicaoIndicador): string | undefined {
    return this.getDisplay(status).icon;
  }

  /**
   * Retorna lista de todos os status para seleção em formulários
   */
  static getAllOptions(): Array<{ value: StatusMedicaoIndicador; label: string }> {
    return [
      { value: StatusMedicaoIndicador.NAO_MEDIDO, label: this.getLabel(StatusMedicaoIndicador.NAO_MEDIDO) },
      { value: StatusMedicaoIndicador.MEDIDO_NAO_CONFIAVEL, label: this.getLabel(StatusMedicaoIndicador.MEDIDO_NAO_CONFIAVEL) },
      { value: StatusMedicaoIndicador.MEDIDO_CONFIAVEL, label: this.getLabel(StatusMedicaoIndicador.MEDIDO_CONFIAVEL) }
    ];
  }
}
