import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PerfilUsuarioBasic {
  id: string;
  codigo: string;
  nome: string;
  nivel: number;
}

export interface EmpresaBasic {
  id: string;
  nome: string;
  cnpj: string;
  logoUrl?: string | null;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  telefone?: string;
  perfil: PerfilUsuarioBasic | string;
  ativo: boolean;
  empresaId?: string;
  empresa?: EmpresaBasic;
  fotoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUsuarioRequest {
  email: string;
  nome: string;
  senha: string;
  cargo: string;
  telefone?: string;
  perfilId: string;
  empresaId?: string;
}

export interface UpdateUsuarioRequest {
  email?: string;
  nome?: string;
  cargo?: string;
  telefone?: string;
  perfilId?: string;
  ativo?: boolean;
  empresaId?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  /**
   * Listar todos os usuários
   */
  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.API_URL);
  }

  /**
   * Buscar usuários disponíveis (sem empresa associada)
   */
  getDisponiveis(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.API_URL}/disponiveis/empresa`);
  }

  /**
   * Buscar usuário por ID
   */
  getById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_URL}/${id}`);
  }

  /**
   * Criar novo usuário
   */
  create(data: CreateUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.API_URL, data);
  }

  /**
   * Atualizar usuário
   */
  update(id: string, data: UpdateUsuarioRequest): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.API_URL}/${id}`, data);
  }

  /**
   * Deletar/Remover usuário permanentemente
   */
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  /**
   * Inativar usuário
   */
  inactivate(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/inativar`, {});
  }

  /**
   * Ativar usuário
   */
  activate(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}`, { ativo: true });
  }

  /**
   * Pesquisar usuários por nome ou email
   */
  search(query: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.API_URL}/search`, {
      params: { q: query }
    });
  }
}
