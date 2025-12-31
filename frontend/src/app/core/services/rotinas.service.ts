import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Rotina {
  id: string;
  nome: string;
  descricao?: string;
  ordem?: number;
  modelo: boolean;
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

export interface CreateRotinaDto {
  nome: string;
  descricao?: string;
  ordem?: number;
  pilarId: string;
  modelo?: boolean;
  pilarEmpresaId?: string;
}

export interface UpdateRotinaDto {
  nome?: string;
  descricao?: string;
  ordem?: number;
  modelo?: boolean;
  ativo?: boolean;
}

export interface ReordenarRotinaDto {
  id: string;
  ordem: number;
}

@Injectable({
  providedIn: 'root'
})
export class RotinasService {
  private readonly apiUrl = `${environment.apiUrl}/rotinas`;

  constructor(private http: HttpClient) {}

  findAll(pilarId?: string): Observable<Rotina[]> {
    if (pilarId) {
      return this.http.get<Rotina[]>(this.apiUrl, { params: { pilarId } });
    }
    return this.http.get<Rotina[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Rotina> {
    return this.http.get<Rotina>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateRotinaDto): Observable<Rotina> {
    return this.http.post<Rotina>(this.apiUrl, data);
  }

  update(id: string, data: UpdateRotinaDto): Observable<Rotina> {
    return this.http.patch<Rotina>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: string): Observable<Rotina> {
    return this.http.delete<Rotina>(`${this.apiUrl}/${id}`);
  }

  reordenarPorPilar(pilarId: string, ordens: ReordenarRotinaDto[]): Observable<Rotina[]> {
    return this.http.post<Rotina[]>(
      `${this.apiUrl}/pilar/${pilarId}/reordenar`,
      { ordens }
    );
  }

  reativar(id: string): Observable<Rotina> {
    return this.http.patch<Rotina>(`${this.apiUrl}/${id}`, { ativo: true });
  }
}
