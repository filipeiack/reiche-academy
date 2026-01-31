import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, PerfilUsuarioBasic, EmpresaBasic } from '../models/auth.model';

export interface CreateUsuarioDto {
  nome: string;
  perfilId: string;
  email?: string;
  senha?: string;
  cargo?: string;
  telefone?: string;
  empresaId?: string;
}

export interface UpdateUsuarioDto {
  nome?: string;
  perfilId?: string;
  email?: string;
  senha?: string;
  cargo?: string;
  telefone?: string;
  ativo?: boolean;
  empresaId?: string | null;
}

export interface UsuarioCargoCockpit {
  cargo: string;
  pilar: string;
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
   * Buscar cargos do usuário via Cockpit
   */
  getCargosCockpitByUsuario(id: string): Observable<UsuarioCargoCockpit[]> {
    return this.http.get<UsuarioCargoCockpit[]>(`${this.API_URL}/${id}/cargos-cockpit`);
  }

  /**
   * Criar novo usuário
   */
  create(data: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(this.API_URL, data);
  }

  /**
   * Atualizar usuário
   */
  update(id: string, data: UpdateUsuarioDto): Observable<Usuario> {
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
