import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Injectable()
export class ForbiddenInterceptor implements HttpInterceptor {
  private lastForbiddenAt = 0;
  private readonly throttleMs = 2000;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          const now = Date.now();
          if (now - this.lastForbiddenAt > this.throttleMs) {
            this.lastForbiddenAt = now;
            this.showForbiddenToast();
          }

          const payload = error?.error && typeof error.error === 'object'
            ? { ...error.error, message: this.getForbiddenMessage(error) }
            : { message: this.getForbiddenMessage(error) };

          const normalizedError = new HttpErrorResponse({
            error: payload,
            headers: error.headers,
            status: error.status,
            statusText: error.statusText || 'Forbidden',
            url: error.url || undefined,
          });

          return throwError(() => normalizedError);
        }

        return throwError(() => error);
      }),
    );
  }

  private getForbiddenMessage(_error: HttpErrorResponse): string {
    return 'Seu perfil não tem permissão para realizar esta ação.';
  }

  private showForbiddenToast(): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
      title: 'Seu perfil não tem permissão para realizar esta ação.',
      icon: 'error',
    });
  }
}
