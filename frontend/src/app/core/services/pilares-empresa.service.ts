import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pilar } from './pilares.service';

export interface PilarEmpresa {
  id: string;
  empresaId: string;
  pilarId: string;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  pilar: Pilar;
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
   * Desassociar um pilar de uma empresa (soft delete)
   */
  desassociarPilar(empresaId: string, pilarEmpresaId: string): Observable<{
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
}
