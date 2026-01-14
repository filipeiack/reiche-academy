import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PeriodoAvaliacao, PeriodoComSnapshots } from '../models/periodo-avaliacao.model';

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
   * @param dataReferencia Data de referência (último dia do trimestre)
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
  congelar(periodoId: string): Observable<PeriodoComSnapshots> {
    return this.http.post<PeriodoComSnapshots>(
      `${this.baseUrl}/periodos-avaliacao/${periodoId}/congelar`,
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
}
