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

export enum Criticidade {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAIXA = 'BAIXA',
}

export enum StatusAcao {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
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
  historico?: number;
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
  statusMapeamento: StatusProcesso | null;
  statusTreinamento: StatusProcesso | null;
  ordem: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  _count?: {
    fluxogramaAcoes: number;
  };
}

export interface ProcessoFluxograma {
  id: string;
  processoPrioritarioId: string;
  descricao: string;
  ordem: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CargoCockpitResponsavel {
  id: string;
  cargoCockpitId: string;
  usuarioId: string;
  usuario?: {
    id: string;
    nome: string;
    email?: string;
  };
}

export interface CargoCockpit {
  id: string;
  cockpitPilarId: string;
  cargo: string;
  ordem: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  responsaveis?: CargoCockpitResponsavel[];
  funcoes?: FuncaoCargo[];
}

export interface FuncaoCargo {
  id: string;
  cargoCockpitId: string;
  descricao: string;
  nivelCritico: Criticidade;
  autoAvaliacao?: number | null;
  avaliacaoLideranca?: number | null;
  ordem: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AcaoCockpit {
  id: string;
  cockpitPilarId: string;
  indicadorCockpitId?: string | null;
  indicadorMensalId?: string | null;
  indicadorCockpit?: {
    id: string;
    nome: string;
  };
  indicadorMensal?: {
    id: string;
    mes: number | null;
    ano: number;
  };
  causa1?: string | null;
  causa2?: string | null;
  causa3?: string | null;
  causa4?: string | null;
  causa5?: string | null;
  acaoProposta: string;
  responsavelId?: string | null;
  responsavel?: {
    id: string;
    nome: string;
    email?: string;
  };
  status: StatusAcao;
  prazo?: string | null;
  dataConclusao?: string | null;
  statusCalculado?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// DTOs
export interface CreateCockpitPilarDto {
  pilarEmpresaId: string; // Obrigatório no backend
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
  statusMapeamento: StatusProcesso | null;
  statusTreinamento: StatusProcesso | null;
}

export interface CreateCargoCockpitDto {
  cargo: string;
  responsavelIds?: string[];
  ordem?: number;
}

export interface UpdateCargoCockpitDto {
  cargo?: string;
  responsavelIds?: string[];
  ordem?: number;
}

export interface CreateFuncaoCargoDto {
  descricao: string;
  nivelCritico: Criticidade;
  autoAvaliacao?: number | null;
  avaliacaoLideranca?: number | null;
  ordem?: number;
}

export interface UpdateFuncaoCargoDto {
  descricao?: string;
  nivelCritico?: Criticidade;
  autoAvaliacao?: number | null;
  avaliacaoLideranca?: number | null;
  ordem?: number;
}

export interface CreateAcaoCockpitDto {
  indicadorMensalId: string;
  causa1?: string | null;
  causa2?: string | null;
  causa3?: string | null;
  causa4?: string | null;
  causa5?: string | null;
  acaoProposta: string;
  responsavelId?: string | null;
  status?: StatusAcao;
  prazo: string;
  dataConclusao?: string | null;
}

export interface UpdateAcaoCockpitDto {
  indicadorMensalId?: string;
  causa1?: string | null;
  causa2?: string | null;
  causa3?: string | null;
  causa4?: string | null;
  causa5?: string | null;
  acaoProposta?: string;
  responsavelId?: string | null;
  status?: StatusAcao;
  prazo?: string | null;
  dataConclusao?: string | null;
}

export interface CreateProcessoFluxogramaDto {
  descricao: string;
}

export interface UpdateProcessoFluxogramaDto {
  descricao?: string;
}

export interface ReordenarProcessoFluxogramaDto {
  ordens: { id: string; ordem: number }[];
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
