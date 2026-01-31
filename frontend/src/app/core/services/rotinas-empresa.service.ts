import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

export interface UpdateRotinaEmpresaDto {
  nome?: string;
  observacao?: string;
}

export interface ReordenarRotinasDto {
  ordens: Array<{
    id: string;
    ordem: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class RotinasEmpresaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/empresas`;

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
  removerRotina(empresaId: string, pilarEmpresaId: string, rotinaEmpresaId: string): Observable<{
    message: string;
    rotinaEmpresa: RotinaEmpresa;
  }> {
    return this.http.delete<{
      message: string;
      rotinaEmpresa: RotinaEmpresa;
    }>(`${this.API_URL}/${empresaId}/pilares/${pilarEmpresaId}/rotinas/${rotinaEmpresaId}`);
  }

  /**
   * Atualizar rotina da empresa (nome e/ou observação)
   */
  updateRotinaEmpresa(empresaId: string, pilarEmpresaId: string, rotinaEmpresaId: string, dto: UpdateRotinaEmpresaDto): Observable<RotinaEmpresa> {
    return this.http.patch<RotinaEmpresa>(
      `${this.API_URL}/${empresaId}/pilares/${pilarEmpresaId}/rotinas/${rotinaEmpresaId}`,
      dto
    );
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
