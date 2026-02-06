import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  PeriodoAvaliacao, 
  PeriodoComSnapshots, 
  CongelarPeriodoResponse,
  RecongelarPeriodoResponse 
} from '../models/periodo-avaliacao.model';

export interface IniciarPeriodoRequest {
  dataReferencia: string; // ISO 8601 date string
}

@Injectable({
  providedIn: 'root'
})
export class PeriodosAvaliacaoService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}`;

  /**
   * Retorna o período de avaliação atual (aberto) da empresa, se existir
   */
  getAtual(empresaId: string): Observable<PeriodoAvaliacao | null> {
    return this.http.get<PeriodoAvaliacao | null>(
      `${this.baseUrl}/empresas/${empresaId}/periodos-avaliacao/atual`
    );
  }

  /**
   * Inicia um novo período de avaliação trimestral
   * @param empresaId ID da empresa
   * @param dataReferencia Data de referência do período (qualquer data)
   */
  iniciar(empresaId: string, dataReferencia: string): Observable<PeriodoAvaliacao> {
    const request: IniciarPeriodoRequest = { dataReferencia };
    return this.http.post<PeriodoAvaliacao>(
      `${this.baseUrl}/empresas/${empresaId}/periodos-avaliacao`,
      request
    );
  }

  /**
   * Congela o período atual, criando snapshots de todos os pilares ativos
   * @param periodoId ID do período a ser congelado
   */
  congelar(periodoId: string): Observable<CongelarPeriodoResponse> {
    return this.http.post<CongelarPeriodoResponse>(
      `${this.baseUrl}/periodos-avaliacao/${periodoId}/congelar`,
      {}
    );
  }

  /**
   * Recongela um período já encerrado, atualizando os snapshots com médias atuais
   * @param periodoId ID do período a ser recongelado
   */
  recongelar(periodoId: string): Observable<RecongelarPeriodoResponse> {
    return this.http.post<RecongelarPeriodoResponse>(
      `${this.baseUrl}/periodos-avaliacao/${periodoId}/recongelar`,
      {}
    );
  }

  /**
   * Retorna histórico de períodos de avaliação (congelados) da empresa
   * @param empresaId ID da empresa
   * @param ano Filtro opcional por ano
   */
  getHistorico(empresaId: string, ano?: number): Observable<PeriodoComSnapshots[]> {
    const options = ano ? { params: { ano: ano.toString() } } : {};
    return this.http.get<PeriodoComSnapshots[]>(
      `${this.baseUrl}/empresas/${empresaId}/periodos-avaliacao`,
      options
    );
  }

  /**
   * Busca a primeira data de referência da empresa
   * @param empresaId ID da empresa
   * @returns Data da primeira avaliação ou null se não existe
   */
  getPrimeiraData(empresaId: string): Observable<{ primeiraData: string | null }> {
    return this.http.get<{ primeiraData: string | null }>(
      `${this.baseUrl}/empresas/${empresaId}/periodos-avaliacao/primeira`
    );
  }

  /**
   * Criar primeira data de referência + primeiro período com snapshots
   * @param empresaId ID da empresa
   * @param dataReferencia Data de referência inicial
   */
  criarPrimeiraData(empresaId: string, dataReferencia: string): Observable<{
    message: string;
    periodo: PeriodoAvaliacao;
    snapshots: any[];
  }> {
    return this.http.post<{
      message: string;
      periodo: PeriodoAvaliacao;
      snapshots: any[];
    }>(
      `${this.baseUrl}/empresas/${empresaId}/periodos-avaliacao/primeira-data`,
      { dataReferencia }
    );
  }

  /**
   * Congelar/atualizar período automaticamente baseado em janela temporal
   * @param empresaId ID da empresa
   */
  congelarAutomatico(empresaId: string): Observable<{
    message: string;
    periodo: PeriodoAvaliacao;
    snapshots: any[];
  }> {
    return this.http.post<{
      message: string;
      periodo: PeriodoAvaliacao;
      snapshots: any[];
    }>(
      `${this.baseUrl}/empresas/${empresaId}/periodos-avaliacao/congelar-auto`,
      {}
    );
  }
}
