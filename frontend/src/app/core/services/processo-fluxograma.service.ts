import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ProcessoFluxograma,
  CreateProcessoFluxogramaDto,
  UpdateProcessoFluxogramaDto,
  ReordenarProcessoFluxogramaDto,
} from '@core/interfaces/cockpit-pilares.interface';

@Injectable({
  providedIn: 'root',
})
export class ProcessoFluxogramaService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  listarAcoes(processoId: string): Observable<ProcessoFluxograma[]> {
    return this.http.get<ProcessoFluxograma[]>(
      `${this.API}/processos-prioritarios/${processoId}/fluxograma`,
    );
  }

  criarAcao(
    processoId: string,
    dto: CreateProcessoFluxogramaDto,
  ): Observable<ProcessoFluxograma> {
    return this.http.post<ProcessoFluxograma>(
      `${this.API}/processos-prioritarios/${processoId}/fluxograma`,
      dto,
    );
  }

  atualizarAcao(
    processoId: string,
    acaoId: string,
    dto: UpdateProcessoFluxogramaDto,
  ): Observable<ProcessoFluxograma> {
    return this.http.patch<ProcessoFluxograma>(
      `${this.API}/processos-prioritarios/${processoId}/fluxograma/${acaoId}`,
      dto,
    );
  }

  removerAcao(processoId: string, acaoId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API}/processos-prioritarios/${processoId}/fluxograma/${acaoId}`,
    );
  }

  reordenarAcoes(
    processoId: string,
    dto: ReordenarProcessoFluxogramaDto,
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.API}/processos-prioritarios/${processoId}/fluxograma/reordenar`,
      dto,
    );
  }
}
