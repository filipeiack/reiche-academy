import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  create(empresaId: string, dto: { dataInicio: Date | string }): Observable<PeriodoMentoria> {
    const dataInicio = typeof dto.dataInicio === 'string' 
      ? new Date(dto.dataInicio).toISOString() 
      : dto.dataInicio.toISOString();
    
    return this.http.post<PeriodoMentoria>(
      `${this.apiUrl}/empresas/${empresaId}/periodos-mentoria`,
      { dataInicio },
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
      ? new Date(dataInicio).toISOString() 
      : dataInicio.toISOString();
    
    return this.http.post<PeriodoMentoria>(
      `${this.apiUrl}/empresas/${empresaId}/periodos-mentoria/${periodoId}/renovar`,
      { dataInicio: data },
    );
  }
}
