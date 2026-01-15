// Enums
export enum TipoMedidaIndicador {
  REAL = 'REAL',
  QUANTIDADE = 'QUANTIDADE',
  TEMPO = 'TEMPO',
  PERCENTUAL = 'PERCENTUAL',
}

export enum StatusMedicaoIndicador {
  NAO_MEDIDO = 'NAO_MEDIDO',
  MEDIDO_NAO_CONFIAVEL = 'MEDIDO_NAO_CONFIAVEL',
  MEDIDO_CONFIAVEL = 'MEDIDO_CONFIAVEL',
}

export enum DirecaoIndicador {
  MAIOR = 'MAIOR',
  MENOR = 'MENOR',
}

export enum StatusProcesso {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
}

// Entidades
export interface CockpitPilar {
  id: string;
  pilarEmpresaId: string;
  pilarEmpresa?: any; // PilarEmpresa
  entradas?: string;
  saidas?: string;
  missao?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  indicadores?: IndicadorCockpit[];
  processosPrioritarios?: ProcessoPrioritario[];
  _count?: {
    indicadores: number;
    processosPrioritarios: number;
  };
}

export interface IndicadorCockpit {
  id: string;
  cockpitPilarId: string;
  nome: string;
  descricao?: string;
  tipoMedida: TipoMedidaIndicador;
  statusMedicao: StatusMedicaoIndicador;
  responsavelMedicaoId?: string;
  responsavelMedicao?: {
    id: string;
    nome: string;
    email?: string;
  };
  melhor: DirecaoIndicador;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  mesesIndicador?: IndicadorMensal[];
}

export interface IndicadorMensal {
  id: string;
  indicadorCockpitId: string;
  mes: number | null; // 1-12 ou null (resumo anual)
  ano: number;
  meta?: number;
  realizado?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ProcessoPrioritario {
  id: string;
  cockpitPilarId: string;
  rotinaEmpresaId: string;
  rotinaEmpresa?: any; // RotinaEmpresa
  statusMapeamento: StatusProcesso;
  statusTreinamento: StatusProcesso;
  ordem: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// DTOs
export interface CreateCockpitPilarDto {
  pilarEmpresaId?: string; // Opcional pois vem da URL
  entradas?: string;
  saidas?: string;
  missao?: string;
}

export interface UpdateCockpitPilarDto {
  entradas?: string;
  saidas?: string;
  missao?: string;
}

export interface CreateIndicadorCockpitDto {
  nome: string;
  descricao?: string;
  tipoMedida: TipoMedidaIndicador;
  statusMedicao: StatusMedicaoIndicador;
  responsavelMedicaoId?: string;
  melhor: DirecaoIndicador;
  ordem?: number;
}

export interface UpdateIndicadorCockpitDto {
  nome?: string;
  descricao?: string;
  tipoMedida?: TipoMedidaIndicador;
  statusMedicao?: StatusMedicaoIndicador;
  responsavelMedicaoId?: string;
  melhor?: DirecaoIndicador;
  ordem?: number;
}

export interface ValorMensalDto {
  mes: number | null;
  ano: number;
  meta?: number;
  realizado?: number;
}

export interface UpdateValoresMensaisDto {
  valores: ValorMensalDto[];
}

export interface UpdateProcessoPrioritarioDto {
  statusMapeamento: StatusProcesso;
  statusTreinamento: StatusProcesso;
}

export interface DadosGraficos {
  ano: number;
  indicadores: IndicadorCockpit[];
}

export interface DadosGraficoResponse {
  meses: number[];
  metas: (number | null)[];
  realizados: (number | null)[];
}
