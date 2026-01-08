import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Pilar {
  id: string;
  nome: string;
  descricao?: string;
  ordem?: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  _count?: {
    rotinas: number;
    empresas: number;
  };
  rotinas?: any[];
  empresas?: any[];
}

export interface CreatePilarDto {
  nome: string;
  descricao?: string;
  ordem?: number;
}

export interface UpdatePilarDto {
  nome?: string;
  descricao?: string;
  ordem?: number;
  ativo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PilaresService {
  private readonly apiUrl = `${environment.apiUrl}/pilares`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Pilar[]> {
    return this.http.get<Pilar[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Pilar> {
    return this.http.get<Pilar>(`${this.apiUrl}/${id}`);
  }

  create(data: CreatePilarDto): Observable<Pilar> {
    return this.http.post<Pilar>(this.apiUrl, data);
  }

  update(id: string, data: UpdatePilarDto): Observable<Pilar> {
    return this.http.patch<Pilar>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: string): Observable<Pilar> {
    return this.http.delete<Pilar>(`${this.apiUrl}/${id}`);
  }

  reativar(id: string): Observable<Pilar> {
    return this.http.patch<Pilar>(`${this.apiUrl}/${id}`, { ativo: true });
  }
}
