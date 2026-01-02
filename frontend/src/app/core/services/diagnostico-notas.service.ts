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

export interface ResponsavelPilar {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
}

export interface PilarEmpresa {
  id: string;
  empresaId: string;
  pilarId: string;
  ordem: number;
  responsavelId?: string;
  pilar: Pilar;
  responsavel?: ResponsavelPilar;
  rotinasEmpresa: RotinaEmpresa[];
}

export interface UpdateNotaRotinaDto {
  nota: number;
  criticidade: 'ALTO' | 'MEDIO' | 'BAIXO';
}

export interface VincularRotinaDto {
  rotinaId: string;
  ordem?: number;
}

export interface ReordenarRotinasDto {
  ordens: Array<{ id: string; ordem: number }>;
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

  /**
   * Listar rotinas vinculadas a um pilar da empresa
   */
  listarRotinas(empresaId: string, pilarEmpresaId: string): Observable<RotinaEmpresa[]> {
    return this.http.get<RotinaEmpresa[]>(
      `${this.apiUrl}/empresas/${empresaId}/pilares/${pilarEmpresaId}/rotinas`
    );
  }

  /**
   * Vincular uma rotina a um pilar da empresa
   */
  vincularRotina(
    empresaId: string,
    pilarEmpresaId: string,
    dto: VincularRotinaDto
  ): Observable<RotinaEmpresa> {
    return this.http.post<RotinaEmpresa>(
      `${this.apiUrl}/empresas/${empresaId}/pilares/${pilarEmpresaId}/rotinas`,
      dto
    );
  }

  /**
   * Remover uma rotina de um pilar da empresa
   */
  removerRotina(empresaId: string, rotinaEmpresaId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/empresas/${empresaId}/pilares/rotinas/${rotinaEmpresaId}`
    );
  }

  /**
   * Reordenar rotinas de um pilar da empresa
   */
  reordenarRotinas(
    empresaId: string,
    pilarEmpresaId: string,
    dto: ReordenarRotinasDto
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/empresas/${empresaId}/pilares/${pilarEmpresaId}/rotinas/reordenar`,
      dto
    );
  }
}
