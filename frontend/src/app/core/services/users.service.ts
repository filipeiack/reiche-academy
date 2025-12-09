import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  perfil: 'CONSULTOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
  ativo: boolean;
  empresaId?: string;
  fotoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUsuarioRequest {
  email: string;
  nome: string;
  senha: string;
  cargo: string;
  perfil: 'CONSULTOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
  empresaId?: string;
}

export interface UpdateUsuarioRequest {
  email?: string;
  nome?: string;
  cargo?: string;
  perfil?: 'CONSULTOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
  ativo?: boolean;
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
   * Deletar/Desativar usuário
   */
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
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
