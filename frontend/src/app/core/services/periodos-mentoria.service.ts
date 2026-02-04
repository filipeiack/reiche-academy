import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { formatDateInputSaoPaulo } from '../utils/date-time';

export interface PeriodoMentoria {
  id: string;
  empresaId: string;
  numero: number;
  dataInicio: Date;
  dataFim: Date;
  ativo: boolean;
  dataContratacao: Date;
  dataEncerramento?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PeriodosMentoriaService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create(empresaId: string, dto: { dataInicio: Date | string; dataFim?: Date | string }): Observable<PeriodoMentoria> {
    const dataInicio = typeof dto.dataInicio === 'string'
      ? dto.dataInicio.includes('T')
        ? formatDateInputSaoPaulo(new Date(dto.dataInicio))
        : dto.dataInicio
      : formatDateInputSaoPaulo(dto.dataInicio);

    const dataFim = dto.dataFim
      ? typeof dto.dataFim === 'string'
        ? dto.dataFim.includes('T')
          ? formatDateInputSaoPaulo(new Date(dto.dataFim))
          : dto.dataFim
        : formatDateInputSaoPaulo(dto.dataFim)
      : undefined;
    
    return this.http.post<PeriodoMentoria>(
      `${this.apiUrl}/empresas/${empresaId}/periodos-mentoria`,
      { dataInicio, dataFim },
    );
  }

  listarPorEmpresa(empresaId: string): Observable<PeriodoMentoria[]> {
    return this.http.get<PeriodoMentoria[]>(
      `${this.apiUrl}/empresas/${empresaId}/periodos-mentoria`,
    );
  }

  getPeriodoAtivo(empresaId: string): Observable<PeriodoMentoria | null> {
    return this.http.get<PeriodoMentoria | null>(
      `${this.apiUrl}/empresas/${empresaId}/periodos-mentoria/ativo`,
    );
  }

  renovar(
    empresaId: string,
    periodoId: string,
    dataInicio: Date | string,
  ): Observable<PeriodoMentoria> {
    const data = typeof dataInicio === 'string'
      ? dataInicio.includes('T')
        ? formatDateInputSaoPaulo(new Date(dataInicio))
        : dataInicio
      : formatDateInputSaoPaulo(dataInicio);
    
    return this.http.post<PeriodoMentoria>(
      `${this.apiUrl}/empresas/${empresaId}/periodos-mentoria/${periodoId}/renovar`,
      { dataInicio: data },
    );
  }

  encerrar(empresaId: string, periodoId: string): Observable<PeriodoMentoria> {
    return this.http.post<PeriodoMentoria>(
      `${this.apiUrl}/empresas/${empresaId}/periodos-mentoria/${periodoId}/encerrar`,
      {},
    );
  }
}
