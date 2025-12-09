import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  /**
   * Upload foto de perfil do usuário
   * @param usuarioId ID do usuário
   * @param file Arquivo de imagem
   */
  uploadProfilePhoto(usuarioId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('foto', file);

    return this.http.post<any>(`${this.API_URL}/${usuarioId}/foto`, formData);
  }

  /**
   * Deletar foto de perfil do usuário
   * @param usuarioId ID do usuário
   */
  deleteProfilePhoto(usuarioId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${usuarioId}/foto`);
  }

  /**
   * Obter informações do perfil do usuário
   * @param usuarioId ID do usuário
   */
  getUserProfile(usuarioId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${usuarioId}`);
  }
}
