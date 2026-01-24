import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Set security headers
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    response.setHeader('Content-Security-Policy', csp);

    // Remove sensitive information from error responses
    return next.handle().pipe(
      tap(data => {
        // Remove password fields from responses
        if (data && typeof data === 'object') {
          this.removeSensitiveFields(data);
        }
      })
    );
  }

  private removeSensitiveFields(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    const sensitiveFields = ['senha', 'password', 'token', 'refreshToken'];
    
    for (const key in obj) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          obj[key].forEach(item => this.removeSensitiveFields(item));
        } else {
          this.removeSensitiveFields(obj[key]);
        }
      }
    }
  }
}