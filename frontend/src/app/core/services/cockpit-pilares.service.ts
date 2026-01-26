import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CockpitPilar,
  CreateCockpitPilarDto,
  UpdateCockpitPilarDto,
  IndicadorCockpit,
  CreateIndicadorCockpitDto,
  UpdateIndicadorCockpitDto,
  UpdateValoresMensaisDto,
  ProcessoPrioritario,
  UpdateProcessoPrioritarioDto,
  DadosGraficos,
  IndicadorMensal,
} from '../interfaces/cockpit-pilares.interface';

@Injectable({
  providedIn: 'root',
})
export class CockpitPilaresService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  // ==================== COCKPITS ====================

  createCockpit(
    empresaId: string,
    pilarEmpresaId: string,
    dto: CreateCockpitPilarDto
  ): Observable<CockpitPilar> {
    return this.http.post<CockpitPilar>(
      `${this.API}/empresas/${empresaId}/pilares/${pilarEmpresaId}/cockpit`,
      dto
    );
  }

  getCockpitsByEmpresa(empresaId: string): Observable<CockpitPilar[]> {
    return this.http.get<CockpitPilar[]>(
      `${this.API}/empresas/${empresaId}/cockpits`
    );
  }

  getCockpitById(cockpitId: string): Observable<CockpitPilar> {
    return this.http.get<CockpitPilar>(`${this.API}/cockpits/${cockpitId}`);
  }

  updateCockpit(
    cockpitId: string,
    dto: UpdateCockpitPilarDto
  ): Observable<CockpitPilar> {
    return this.http.patch<CockpitPilar>(
      `${this.API}/cockpits/${cockpitId}`,
      dto
    );
  }

  deleteCockpit(cockpitId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API}/cockpits/${cockpitId}`
    );
  }

  // ==================== INDICADORES ====================

  createIndicador(
    cockpitId: string,
    dto: CreateIndicadorCockpitDto
  ): Observable<IndicadorCockpit> {
    return this.http.post<IndicadorCockpit>(
      `${this.API}/cockpits/${cockpitId}/indicadores`,
      dto
    );
  }

  updateIndicador(
    indicadorId: string,
    dto: UpdateIndicadorCockpitDto
  ): Observable<IndicadorCockpit> {
    return this.http.patch<IndicadorCockpit>(
      `${this.API}/indicadores/${indicadorId}`,
      dto
    );
  }

  deleteIndicador(indicadorId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API}/indicadores/${indicadorId}`
    );
  }

  updateValoresMensais(
    indicadorId: string,
    dto: UpdateValoresMensaisDto
  ): Observable<IndicadorMensal[]> {
    return this.http.patch<IndicadorMensal[]>(
      `${this.API}/indicadores/${indicadorId}/meses`,
      dto
    );
  }

  getMesesIndicador(
    indicadorId: string,
    ano: number
  ): Observable<IndicadorMensal[]> {
    return this.http.get<IndicadorMensal[]>(
      `${this.API}/indicadores/${indicadorId}/meses?ano=${ano}`
    );
  }

  /**
   * Criar novo ciclo de 12 meses para todos os indicadores do cockpit
   */
  criarNovoCicloMeses(cockpitId: string): Observable<{ sucesso: boolean; indicadores: number; mesesCriados: number }> {
    return this.http.post<{ sucesso: boolean; indicadores: number; mesesCriados: number }>(
      `${this.API}/cockpits/${cockpitId}/meses/ciclo`,
      {}
    );
  }

  // ==================== PROCESSOS PRIORITÁRIOS ====================

  getProcessosPrioritarios(
    cockpitId: string
  ): Observable<ProcessoPrioritario[]> {
    return this.http.get<ProcessoPrioritario[]>(
      `${this.API}/cockpits/${cockpitId}/processos`
    );
  }

  updateProcessoPrioritario(
    processoId: string,
    dto: UpdateProcessoPrioritarioDto
  ): Observable<ProcessoPrioritario> {
    return this.http.patch<ProcessoPrioritario>(
      `${this.API}/processos-prioritarios/${processoId}`,
      dto
    );
  }

  // ==================== GRÁFICOS ====================

  /**
   * R-GRAF-001: Buscar anos disponíveis (com meses criados) para um cockpit
   */
  getAnosDisponiveis(cockpitId: string): Observable<number[]> {
    return this.http.get<number[]>(
      `${this.API}/cockpits/${cockpitId}/anos-disponiveis`
    );
  }

  /**
   * R-GRAF-001: Buscar dados agregados para gráficos
   * @param filtro - 'ultimos-12-meses' ou ano específico (ex: '2025')
   */
  getDadosGraficos(
    cockpitId: string,
    filtro: string
  ): Observable<DadosGraficos> {
    return this.http.get<DadosGraficos>(
      `${this.API}/cockpits/${cockpitId}/graficos/dados?filtro=${filtro}`
    );
  }
}
