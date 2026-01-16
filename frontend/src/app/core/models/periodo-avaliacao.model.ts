export interface PeriodoAvaliacao {
  id: string;
  empresaId: string;
  trimestre: number;
  ano: number;
  dataReferencia: Date;
  aberto: boolean;
  dataInicio: Date;
  dataCongelamento?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PeriodoComSnapshots extends PeriodoAvaliacao {
  snapshots: PilarSnapshot[];
}

export interface CongelarPeriodoResponse {
  periodo: PeriodoAvaliacao;
  snapshots: PilarSnapshot[];
}

export interface PilarSnapshot {
  id: string;
  pilarEmpresaId: string;
  periodoAvaliacaoId: string;
  mediaNotas: number;
  createdAt: Date;
}
