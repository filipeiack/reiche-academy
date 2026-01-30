import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Obter o token do AuthService
    const token = this.authService.getToken();

    // Adicionar headers de segurança
    const securityHeaders = {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Se houver token, adicionar ao header Authorization
    if (token) {
      request = request.clone({
        setHeaders: {
          ...securityHeaders,
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      request = request.clone({
        setHeaders: securityHeaders
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Se receber erro 401 (Unauthorized)
        if (error.status === 401) {
          // ⚠️ NÃO tentar refresh em rotas de autenticação
          const url = request.url.toLowerCase();
          const skipRefreshUrls = ['/auth/login', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];
          
          if (skipRefreshUrls.some(skipUrl => url.includes(skipUrl))) {
            // Apenas propagar o erro sem tentar refresh
            return throwError(() => error);
          }
          
          // Para outras rotas, tentar refresh token
          return this.handle401Error(request, next);
        }
        
        // Se receber erro 429 (Too Many Requests) - silencioso
        if (error.status === 429) {
          // Rate limit será tratado pelo backend via headers
        }
        
        return throwError(() => error);
      })
    );
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Se já está renovando, aguardar a conclusão
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.accessToken);

          // Retentar a requisição original com o novo token
          return next.handle(this.addToken(request, response.accessToken));
        }),
        catchError((err) => {
          console.error('[INTERCEPTOR] Refresh token FALHOU, fazendo logout:', err);
          this.isRefreshing = false;
          // Se falhar a renovação, fazer logout
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        })
      );
    } else {
      // Aguardar o novo token ser definido
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
