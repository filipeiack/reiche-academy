import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PerfilUsuario {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  nivel: number;
  ativo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PerfisService {
  private apiUrl = `${environment.apiUrl}/perfis`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<PerfilUsuario[]> {
    return this.http.get<PerfilUsuario[]>(this.apiUrl);
  }
}
