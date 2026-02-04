import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TipoMedidaIndicador = 'REAL' | 'QUANTIDADE' | 'TEMPO' | 'PERCENTUAL';
export type DirecaoIndicador = 'MAIOR' | 'MENOR';

export interface IndicadorTemplate {
  id: string;
  nome: string;
  descricao?: string;
  tipoMedida: TipoMedidaIndicador;
  melhor: DirecaoIndicador;
  ordem: number;
  ativo: boolean;
  pilarId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  pilar?: {
    id: string;
    nome: string;
    ordem?: number;
  };
}

export interface CreateIndicadorTemplateDto {
  nome: string;
  descricao?: string;
  tipoMedida: TipoMedidaIndicador;
  melhor: DirecaoIndicador;
  ordem?: number;
  pilarId: string;
}

export interface UpdateIndicadorTemplateDto {
  nome?: string;
  descricao?: string;
  tipoMedida?: TipoMedidaIndicador;
  melhor?: DirecaoIndicador;
  ordem?: number;
  ativo?: boolean;
  pilarId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IndicadoresTemplatesService {
  private readonly apiUrl = `${environment.apiUrl}/indicadores-templates`;

  constructor(private http: HttpClient) {}

  findAll(pilarId?: string): Observable<IndicadorTemplate[]> {
    if (pilarId) {
      return this.http.get<IndicadorTemplate[]>(this.apiUrl, { params: { pilarId } });
    }
    return this.http.get<IndicadorTemplate[]>(this.apiUrl);
  }

  findOne(id: string): Observable<IndicadorTemplate> {
    return this.http.get<IndicadorTemplate>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateIndicadorTemplateDto): Observable<IndicadorTemplate> {
    return this.http.post<IndicadorTemplate>(this.apiUrl, data);
  }

  update(id: string, data: UpdateIndicadorTemplateDto): Observable<IndicadorTemplate> {
    return this.http.patch<IndicadorTemplate>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: string): Observable<IndicadorTemplate> {
    return this.http.delete<IndicadorTemplate>(`${this.apiUrl}/${id}`);
  }

  reativar(id: string): Observable<IndicadorTemplate> {
    return this.http.patch<IndicadorTemplate>(`${this.apiUrl}/${id}`, { ativo: true });
  }

  desativar(id: string): Observable<IndicadorTemplate> {
    return this.http.patch<IndicadorTemplate>(`${this.apiUrl}/${id}`, { ativo: false });
  }
}
