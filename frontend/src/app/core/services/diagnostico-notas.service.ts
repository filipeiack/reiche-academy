import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RotinasEmpresaService, RotinaEmpresa as RotinaEmpresaBase } from './rotinas-empresa.service';

export interface NotaRotina {
  id: string;
  rotinaEmpresaId: string;
  nota: number;
  criticidade: 'ALTA' | 'MÉDIA' | 'BAIXA';
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

export interface RotinaEmpresa extends RotinaEmpresaBase {
  notas: NotaRotina[];
  rotinaTemplate?: Rotina;
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
  pilarTemplateId?: string | null;
  nome: string;
  ordem: number;
  ativo: boolean;
  responsavelId?: string;
  pilarTemplate?: Pilar;
  responsavel?: ResponsavelPilar;
  rotinasEmpresa: RotinaEmpresa[];
  cockpit?: { id: string; pilarEmpresaId: string } | null;
}

export interface UpdateNotaRotinaDto {
  nota: number;
  criticidade: 'ALTA' | 'MÉDIA' | 'BAIXA';
}

export interface VincularRotinaDto {
  rotinaId: string;
  ordem?: number;
}

export interface MediaPilar {
  pilarEmpresaId: string;
  pilarId: string;
  pilarNome: string;
  mediaAtual: number;
  totalRotinasAvaliadas: number;
  totalRotinas: number;
  ultimaAtualizacao?: string | null;
}

export interface CongelarMediasResponse {
  message: string;
  totalPilaresCongelados: number;
  criados: number;
  atualizados: number;
  data: string;
}

export interface HistoricoEvolucao {
  id: string;
  mediaNotas: number;
  createdAt: string;
  pilarNome: string;
  pilarId: string;
}

@Injectable({
  providedIn: 'root',
})
export class DiagnosticoNotasService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private rotinasEmpresaService = inject(RotinasEmpresaService);

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
   * @deprecated Use RotinasEmpresaService.listarRotinas() diretamente
   */
  listarRotinas(empresaId: string, pilarEmpresaId: string): Observable<RotinaEmpresa[]> {
    return this.rotinasEmpresaService.listarRotinas(empresaId, pilarEmpresaId) as Observable<RotinaEmpresa[]>;
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
   * @deprecated Use RotinasEmpresaService.removerRotina() diretamente
   */
  removerRotina(empresaId: string, pilarEmpresaId: string, rotinaEmpresaId: string): Observable<{ message: string }> {
    return this.rotinasEmpresaService.removerRotina(empresaId, pilarEmpresaId, rotinaEmpresaId) as Observable<{ message: string }>;
  }

  /**
   * Reordenar rotinas de um pilar da empresa
   * @deprecated Use RotinasEmpresaService.reordenarRotinas() diretamente
   */
  reordenarRotinas(
    empresaId: string,
    pilarEmpresaId: string,
    ordens: Array<{ id: string; ordem: number }>
  ): Observable<RotinaEmpresa[]> {
    return this.rotinasEmpresaService.reordenarRotinas(empresaId, pilarEmpresaId, ordens) as Observable<RotinaEmpresa[]>;
  }

  /**
   * Calcular médias atuais dos pilares da empresa
   */
  calcularMediasPilares(empresaId: string): Observable<MediaPilar[]> {
    return this.http.get<MediaPilar[]>(`${this.apiUrl}/empresas/${empresaId}/evolucao/medias`);
  }

  /**
   * Congelar médias atuais na tabela PilarEvolucao
   */
  congelarMedias(empresaId: string): Observable<CongelarMediasResponse> {
    return this.http.post<CongelarMediasResponse>(
      `${this.apiUrl}/empresas/${empresaId}/evolucao/congelar`,
      {}
    );
  }

  /**
   * Buscar histórico de evolução de um pilar
   */
  buscarHistoricoEvolucao(empresaId: string, pilarEmpresaId: string): Observable<HistoricoEvolucao[]> {
    return this.http.get<HistoricoEvolucao[]>(
      `${this.apiUrl}/empresas/${empresaId}/evolucao/historico/${pilarEmpresaId}`
    );
  }
}
