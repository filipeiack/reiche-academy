import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ObjetivoTemplate {
  id: string;
  pilarId: string;
  entradas: string;
  saidas: string;
  missao: string;
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

export interface CreateObjetivoTemplateDto {
  pilarId: string;
  entradas: string;
  saidas: string;
  missao: string;
}

export interface UpdateObjetivoTemplateDto {
  pilarId?: string;
  entradas?: string;
  saidas?: string;
  missao?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ObjetivosTemplatesService {
  private readonly apiUrl = `${environment.apiUrl}/objetivos-templates`;

  constructor(private http: HttpClient) {}

  findAll(pilarId?: string): Observable<ObjetivoTemplate[]> {
    if (pilarId) {
      return this.http.get<ObjetivoTemplate[]>(this.apiUrl, { params: { pilarId } });
    }
    return this.http.get<ObjetivoTemplate[]>(this.apiUrl);
  }

  findOne(id: string): Observable<ObjetivoTemplate> {
    return this.http.get<ObjetivoTemplate>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateObjetivoTemplateDto): Observable<ObjetivoTemplate> {
    return this.http.post<ObjetivoTemplate>(this.apiUrl, data);
  }

  update(id: string, data: UpdateObjetivoTemplateDto): Observable<ObjetivoTemplate> {
    return this.http.patch<ObjetivoTemplate>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: string): Observable<ObjetivoTemplate> {
    return this.http.delete<ObjetivoTemplate>(`${this.apiUrl}/${id}`);
  }
}
