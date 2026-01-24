import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, interval, throwError, catchError } from 'rxjs';
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

  login(credentials: LoginRequest, remember = false): Observable<LoginResponse> {
    console.log('[AuthService] Tentando login para:', credentials.email);
    console.log('[AuthService] URL da requisição:', `${this.API_URL}/login`);
    console.log('[AuthService] Ambiente:', environment.production ? 'produção' : 'desenvolvimento');
    
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        console.log('[AuthService] Login response:', response);
        const storage = remember ? localStorage : sessionStorage;
        this.setSession(response, storage);
        this.initializeTokenRefresh();
      })
    );
  }

  logout(invalidateServer = true): void {
    console.log('[AuthService] Fazendo logout, invalidateServer:', invalidateServer);
    const refreshToken = this.getRefreshToken();
    
    // Clear from both storages to be safe
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      // Limpar também o contexto de empresa selecionada
      localStorage.removeItem('selected_empresa_context');
    } catch {}
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    } catch {}
    
    this.currentUserSubject.next(null);
    this.clearTokenRefreshInterval();
    
    console.log('[AuthService] Sessão local limpa');

    // Invalidate token on server if requested
    if (invalidateServer && refreshToken) {
      console.log('[AuthService] Invalidando token no servidor');
      this.http.post(`${this.API_URL}/logout`, { refreshToken }).subscribe({
        next: () => console.log('[AuthService] Token invalidado no servidor'),
        error: (err) => console.warn('[AuthService] Erro ao invalidar token no servidor:', err)
      });
    }
  }

  logoutAllDevices(): Observable<any> {
    return this.http.post(`${this.API_URL}/logout-all`, {});
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    
    // Se não houver refresh token, retornar erro imediatamente
    if (!refreshToken) {
      console.error('[AuthService] Refresh token não encontrado no storage');
      return throwError(() => new Error('Refresh token not found'));
    }
    
    console.log('[AuthService] Tentando renovar token com refresh token');
    return this.http.post<LoginResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(response => {
        console.log('[AuthService] Token renovado com sucesso');
        this.setSession(response);
      }),
      catchError(error => {
        console.error('[AuthService] Erro ao renovar token:', error);
        return throwError(() => error);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) || sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * Atualiza os dados do usuário atual
   * Útil quando dados do perfil são alterados (ex: avatar, nome, etc)
   */
  updateCurrentUser(user: Usuario): void {
    const storage = this.getActiveStorage();
    storage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private setSession(authResult: LoginResponse, storage: Storage = this.getActiveStorage()): void {
    console.log('[AuthService] Salvando sessão:', {
      hasAccessToken: !!authResult.accessToken,
      hasRefreshToken: !!authResult.refreshToken,
      storageType: storage === localStorage ? 'localStorage' : 'sessionStorage'
    });
    
    storage.setItem(this.TOKEN_KEY, authResult.accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    storage.setItem(this.USER_KEY, JSON.stringify(authResult.usuario));
    this.currentUserSubject.next(authResult.usuario as unknown as Usuario);
    
    console.log('[AuthService] Sessão salva. Verificando:', {
      accessToken: storage.getItem(this.TOKEN_KEY)?.substring(0, 20) + '...',
      refreshToken: storage.getItem(this.REFRESH_TOKEN_KEY)?.substring(0, 20) + '...',
    });
  }

  private loadStoredUser(): void {
    const userJson = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
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

    // Só inicializar intervalo se houver usuário logado
    if (!this.isLoggedIn() || !this.getRefreshToken()) {
      console.log('[AuthService] Não há sessão ativa, não inicializando renovação automática');
      return;
    }

    console.log('[AuthService] Inicializando renovação automática de token (a cada 110 minutos)');

    // Renovar token a cada 1 hora 50 minutos (110 minutos)
    // Access token expira em 2 horas, então renovamos 10 minutos antes
    const refreshInterval = 110 * 60 * 1000; // 110 minutos em milissegundos

    this.tokenRefreshInterval = setInterval(() => {
      if (this.isLoggedIn() && this.getRefreshToken()) {
        console.log('[AuthService] Renovando token automaticamente...');
        this.refreshToken().subscribe({
          next: () => {
            console.log('[AuthService] Token renovado automaticamente com sucesso');
          },
          error: (err) => {
            console.warn('[AuthService] Erro ao renovar token automaticamente, fazendo logout', err);
            // Se falhar, fazer logout
            this.logout();
          }
        });
      } else {
        console.log('[AuthService] Sessão expirada, limpando intervalo de renovação');
        this.clearTokenRefreshInterval();
      }
    }, refreshInterval);
  }

  private clearTokenRefreshInterval(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  private getActiveStorage(): Storage {
    // Prefer storage where the token is currently stored
    const hasLocal = !!localStorage.getItem(this.TOKEN_KEY) || !!localStorage.getItem(this.USER_KEY);
    const hasSession = !!sessionStorage.getItem(this.TOKEN_KEY) || !!sessionStorage.getItem(this.USER_KEY);
    if (hasLocal) return localStorage;
    if (hasSession) return sessionStorage;
    // Default to localStorage
    return localStorage;
  }

  /**
   * Solicita reset de senha - envia email com link
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, { email });
  }

  /**
   * Redefine senha com token
   */
  resetPassword(token: string, novaSenha: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/reset-password`, { token, novaSenha });
  }
}

