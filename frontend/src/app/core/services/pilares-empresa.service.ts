import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pilar } from './pilares.service';

export interface PilarEmpresa {
  id: string;
  empresaId: string;
  pilarTemplateId?: string | null;
  nome: string;
  ordem: number;
  ativo: boolean;
  responsavelId?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  pilarTemplate?: Pilar;
}

export interface VincularPilaresDto {
  pilaresIds: string[];
}

export interface ReordenarPilaresDto {
  ordens: Array<{
    id: string;
    ordem: number;
  }>;
}

export interface RotinaEmpresa {
  id: string;
  rotinaTemplateId?: string | null;
  nome: string;
  pilarEmpresaId: string;
  ordem: number;
  observacao?: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateRotinaEmpresaDto {
  rotinaTemplateId?: string; // UUID do template (para copiar)
  nome?: string; // Nome customizado (se não usar template)
}

export interface ReordenarRotinasDto {
  ordens: Array<{
    id: string;
    ordem: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class PilaresEmpresaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/empresas`;

  /**
   * Listar pilares associados a uma empresa
   */
  listarPilaresDaEmpresa(empresaId: string): Observable<PilarEmpresa[]> {
    return this.http.get<PilarEmpresa[]>(`${this.API_URL}/${empresaId}/pilares`);
  }

  /**
   * Vincular pilares a uma empresa (adição incremental)
   * Retorna objeto com estatísticas e lista completa atualizada
   */
  vincularPilares(empresaId: string, pilaresIds: string[]): Observable<{
    vinculados: number;
    ignorados: string[];
    pilares: PilarEmpresa[];
  }> {
    const dto: VincularPilaresDto = { pilaresIds };
    return this.http.post<{
      vinculados: number;
      ignorados: string[];
      pilares: PilarEmpresa[];
    }>(`${this.API_URL}/${empresaId}/pilares/vincular`, dto);
  }

  /**
   * Remover um pilar de uma empresa
   */
  removerPilar(empresaId: string, pilarEmpresaId: string): Observable<{
    message: string;
    pilarEmpresa: PilarEmpresa;
  }> {
    return this.http.delete<{
      message: string;
      pilarEmpresa: PilarEmpresa;
    }>(`${this.API_URL}/${empresaId}/pilares/${pilarEmpresaId}`);
  }

  /**
   * Reordenar pilares de uma empresa
   */
  reordenarPilares(empresaId: string, ordens: Array<{ id: string; ordem: number }>): Observable<PilarEmpresa[]> {
    const dto: ReordenarPilaresDto = { ordens };
    return this.http.post<PilarEmpresa[]>(`${this.API_URL}/${empresaId}/pilares/reordenar`, dto);
  }

  /**
   * Definir responsável por um pilar
   */
  definirResponsavel(empresaId: string, pilarEmpresaId: string, responsavelId: string | null): Observable<PilarEmpresa> {
    return this.http.patch<PilarEmpresa>(
      `${this.API_URL}/${empresaId}/pilares/${pilarEmpresaId}/responsavel`, 
      { responsavelId }
    );
  }

  /**
   * Listar rotinas de um pilar da empresa
   */
  listarRotinas(empresaId: string, pilarEmpresaId: string): Observable<RotinaEmpresa[]> {
    return this.http.get<RotinaEmpresa[]>(
      `${this.API_URL}/${empresaId}/pilares/${pilarEmpresaId}/rotinas`
    );
  }

  /**
   * Criar rotina customizada para um pilar da empresa
   */
  criarRotinaEmpresa(empresaId: string, pilarEmpresaId: string, dto: CreateRotinaEmpresaDto): Observable<RotinaEmpresa> {
    return this.http.post<RotinaEmpresa>(
      `${this.API_URL}/${empresaId}/pilares/${pilarEmpresaId}/rotinas`,
      dto
    );
  }

  /**
   * Remover rotina de um pilar da empresa
   */
  removerRotina(empresaId: string, rotinaEmpresaId: string): Observable<{
    message: string;
    rotinaEmpresa: RotinaEmpresa;
  }> {
    return this.http.delete<{
      message: string;
      rotinaEmpresa: RotinaEmpresa;
    }>(`${this.API_URL}/${empresaId}/pilares/rotinas/${rotinaEmpresaId}`);
  }

  /**
   * Reordenar rotinas de um pilar da empresa
   */
  reordenarRotinas(empresaId: string, pilarEmpresaId: string, ordens: Array<{ id: string; ordem: number }>): Observable<RotinaEmpresa[]> {
    const dto: ReordenarRotinasDto = { ordens };
    return this.http.patch<RotinaEmpresa[]>(
      `${this.API_URL}/${empresaId}/pilares/${pilarEmpresaId}/rotinas/reordenar`,
      dto
    );
  }
}
