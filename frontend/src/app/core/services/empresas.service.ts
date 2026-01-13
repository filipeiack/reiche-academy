import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type EstadoBrasil = 
  'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA' | 
  'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' | 'RJ' | 'RN' | 
  'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

export interface EmpresaCounts {
  usuarios: number;
  pilares: number;
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  tipoNegocio?: string | null;
  cidade: string;
  estado: EstadoBrasil;
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
  tipoNegocio?: string;
  cidade: string;
  estado: EstadoBrasil;
  loginUrl?: string;
}

export interface UpdateEmpresaRequest {
  nome?: string;
  cnpj?: string;
  tipoNegocio?: string;
  cidade?: string;
  estado?: EstadoBrasil;
  ativo?: boolean;
  logoUrl?: string | null;
  loginUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/empresas`;

  // Subject para notificar quando uma empresa é criada ou atualizada
  private empresaChangedSubject = new Subject<Empresa>();
  empresaChanged$ = this.empresaChangedSubject.asObservable();

  getAll(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.API_URL);
  }

  getById(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.API_URL}/${id}`);
  }

  create(data: CreateEmpresaRequest): Observable<Empresa> {
    return this.http.post<Empresa>(this.API_URL, data).pipe(
      tap(empresa => this.empresaChangedSubject.next(empresa))
    );
  }

  update(id: string, data: UpdateEmpresaRequest): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.API_URL}/${id}`, data).pipe(
      tap(empresa => this.empresaChangedSubject.next(empresa))
    );
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  findCustomizationByCnpj(cnpj: string): Observable<Partial<Empresa>> {
    return this.http.get<Partial<Empresa>>(`${this.API_URL}/customization/${cnpj}`);
  }

  findByLoginUrl(loginUrl: string): Observable<Empresa | null> {
    return this.http.get<Empresa | null>(`${this.API_URL}/by-login-url/${loginUrl}`);
  }

  vincularPilares(id: string, pilaresIds: string[]): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.API_URL}/${id}/pilares`, { pilaresIds });
  }

  getTiposNegocio(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/tipos-negocio/distinct`);
  }

  uploadLogo(id: string, file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ logoUrl: string }>(`${this.API_URL}/${id}/logo`, formData);
  }

  deleteLogo(id: string): Observable<{ logoUrl: null }> {
    return this.http.delete<{ logoUrl: null }>(`${this.API_URL}/${id}/logo`);
  }
}
