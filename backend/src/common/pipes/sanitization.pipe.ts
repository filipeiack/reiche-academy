import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any): any {
    if (!value) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map(item => this.transform(item));
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.transform(val);
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(str: string): string {
    // Remove potential XSS attacks
    const sanitized = DOMPurify.sanitize(str, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true, // Keep text content
    });

    // ✅ REMOVIDO: Validação SQL patterns (causava falsos positivos)
    // Exemplos bloqueados incorretamente:
    // - "SELECT Distribuidora" (nome de empresa)
    // - "admin@createtech.com" (palavra CREATE)
    // - "Processo de INSERT de peças" (palavra INSERT)
    //
    // MOTIVO: Prisma ORM já protege contra SQL Injection via parametrização automática.
    // Validação regex de SQL em strings genéricas é desnecessária e contraproducente.
    
    let result = sanitized;

    // Remove any remaining script or event handlers
    result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    result = result.replace(/on\w+\s*=/gi, '');

    return result.trim();
  }
}

// Specific pipes for different contexts
@Injectable()
export class HtmlSanitizationPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });
    }
    return value;
  }
}

@Injectable()
export class EmailSanitizationPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      // Basic email sanitization - convert to lowercase and trim
      return value.toLowerCase().trim();
    }
    return value;
  }
}