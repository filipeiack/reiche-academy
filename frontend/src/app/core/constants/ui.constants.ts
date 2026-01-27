/**
 * Constantes de UI do sistema
 * Centraliza valores reutilizáveis de interface
 */

/**
 * Tamanhos padrão para Offcanvas/Drawers
 */
export const OFFCANVAS_SIZE = {
  /** Offcanvas com 40% da largura da tela */
  DEFAULT: 'w-40',
  /** Offcanvas com 50% da largura da tela */
  MEDIUM: 'w-50',
  /** Offcanvas com 60% da largura da tela */
  LARGE: 'w-60',
  /** Offcanvas com 30% da largura da tela */
  SMALL: 'w-30'
} as const;

/**
 * Configuração padrão para Offcanvas
 */
export const OFFCANVAS_CONFIG = {
  position: 'end' as const,
  backdrop: 'static' as const,
  panelClass: OFFCANVAS_SIZE.DEFAULT
};
