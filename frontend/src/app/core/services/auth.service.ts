import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, interval } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Usuario } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';
  private tokenRefreshInterval: any;

  constructor() {
    this.loadStoredUser();
    this.initializeTokenRefresh();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
        this.initializeTokenRefresh();
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.clearTokenRefreshInterval();
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<LoginResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * Atualiza os dados do usuário atual
   * Útil quando dados do perfil são alterados (ex: avatar, nome, etc)
   */
  updateCurrentUser(user: Usuario): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.usuario));
    this.currentUserSubject.next(authResult.usuario as unknown as Usuario);
  }

  private loadStoredUser(): void {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
  }

  /**
   * Inicializa a renovação automática do token
   * Renova o token a cada 1 hora 50 minutos (10 minutos antes de expirar)
   */
  private initializeTokenRefresh(): void {
    this.clearTokenRefreshInterval();

    // Renovar token a cada 1 hora 50 minutos (110 minutos)
    // Access token expira em 2 horas, então renovamos 10 minutos antes
    const refreshInterval = 110 * 60 * 1000; // 110 minutos em milissegundos

    this.tokenRefreshInterval = setInterval(() => {
      if (this.isLoggedIn() && this.getRefreshToken()) {
        console.log('Renovando token automaticamente...');
        this.refreshToken().subscribe({
          next: () => {
            console.log('Token renovado com sucesso');
          },
          error: (err) => {
            console.warn('Erro ao renovar token automaticamente', err);
            // Se falhar, fazer logout
            this.logout();
          }
        });
      }
    }, refreshInterval);
  }

  private clearTokenRefreshInterval(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }
}

