import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmpresaCounts {
  usuarios: number;
  pilares: number;
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  razaoSocial: string;
  tipoNegocio: string;
  logoUrl?: string | null;
  loginUrl?: string | null;
  ativo: boolean;
  _count?: EmpresaCounts;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateEmpresaRequest {
  nome: string;
  cnpj: string;
  razaoSocial: string;
  tipoNegocio: string;
}

export interface UpdateEmpresaRequest {
  nome?: string;
  cnpj?: string;
  razaoSocial?: string;
  tipoNegocio?: string;
  ativo?: boolean;
  logoUrl?: string | null;
  loginUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/empresas`;

  getAll(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.API_URL);
  }

  getById(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.API_URL}/${id}`);
  }

  create(data: CreateEmpresaRequest): Observable<Empresa> {
    return this.http.post<Empresa>(this.API_URL, data);
  }

  update(id: string, data: UpdateEmpresaRequest): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.API_URL}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  findCustomizationByCnpj(cnpj: string): Observable<Partial<Empresa>> {
    return this.http.get<Partial<Empresa>>(`${this.API_URL}/customization/${cnpj}`);
  }

  vincularPilares(id: string, pilaresIds: string[]): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.API_URL}/${id}/pilares`, { pilaresIds });
  }
}
