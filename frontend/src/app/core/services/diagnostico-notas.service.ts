import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotaRotina {
  id: string;
  rotinaEmpresaId: string;
  nota: number;
  criticidade: 'ALTO' | 'MEDIO' | 'BAIXO';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Rotina {
  id: string;
  nome: string;
  descricao?: string;
}

export interface RotinaEmpresa {
  id: string;
  pilarEmpresaId: string;
  rotinaId: string;
  ordem: number;
  donoRotina?: string;
  observacao?: string;
  rotina: Rotina;
  notas: NotaRotina[];
}

export interface Pilar {
  id: string;
  nome: string;
  descricao?: string;
}

export interface PilarEmpresa {
  id: string;
  empresaId: string;
  pilarId: string;
  ordem: number;
  pilar: Pilar;
  rotinasEmpresa: RotinaEmpresa[];
}

export interface UpdateNotaRotinaDto {
  nota: number;
  criticidade: 'ALTO' | 'MEDIO' | 'BAIXO';
}

@Injectable({
  providedIn: 'root',
})
export class DiagnosticoNotasService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Buscar estrutura completa de diagnóstico de uma empresa
   * Retorna pilares → rotinas → notas
   */
  getDiagnosticoByEmpresa(empresaId: string): Observable<PilarEmpresa[]> {
    return this.http.get<PilarEmpresa[]>(`${this.apiUrl}/empresas/${empresaId}/diagnostico/notas`);
  }

  /**
   * Atualizar ou criar nota de uma rotina (auto-save)
   */
  upsertNotaRotina(
    rotinaEmpresaId: string,
    dto: UpdateNotaRotinaDto
  ): Observable<{ message: string; nota: NotaRotina }> {
    return this.http.patch<{ message: string; nota: NotaRotina }>(
      `${this.apiUrl}/rotinas-empresa/${rotinaEmpresaId}/nota`,
      dto
    );
  }
}
