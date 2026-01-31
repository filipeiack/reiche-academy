import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SanitizationService {
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Sanitiza texto para prevenir XSS
   * Remove tags HTML e scripts maliciosos
   */
  sanitizeText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove JavaScript event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove potential SQL injection patterns
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '')
      // Remove comments
      .replace(/(--|\*\/|\/\*)/g, '')
      // Trim extra whitespace
      .trim();
  }

  /**
   * Sanitiza HTML permitindo apenas tags seguras
   */
  sanitizeHtml(html: string): SafeHtml {
    if (!html) return '';
    
    // First, remove dangerous elements and attributes
    const cleanHtml = html
      . Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove dangerous attributes
      .replace(/\son\w+\s*=/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove data: protocol (potential XSS)
      .replace(/data:(?!image\/)/gi, '');

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }

  /**
   * Valida email básico para prevenir injection
   */
  validateEmail(email: string): boolean {
    if (!email) return false;
    
    const sanitized = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emailRegex.test(sanitized) && 
           !sanitized.includes('<') && 
           !sanitized.includes('>') &&
           !sanitized.includes('javascript:') &&
           !sanitized.includes('data:');
  }

  /**
   * Sanitiza input de formulário
   */
  sanitizeFormInput(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeText(value);
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeFormInput(item));
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeFormInput(val);
      }
      return sanitized;
    }
    
    return value;
  }

  /**
   * Detecta padrões suspeitos no input
   */
  containsSuspiciousPatterns(text: string): boolean {
    if (!text) return false;
    
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:(?!image\/)/i,
      /vbscript:/i,
      /expression\s*\(/i,
      /@import/i,
      /binding:/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Sanitiza URL para prevenir redirect attacks
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';
    
    // Remove javascript: and data: protocols
    const cleanUrl = url
      .replace(/^javascript:/i, '')
      .replace(/^data:(?!image\/)/i, '')
      .replace(/^vbscript:/i, '');

    // Only allow http, https, and relative URLs
    if (cleanUrl.match(/^https?:\/\//) || cleanUrl.startsWith('/') || cleanUrl.startsWith('./')) {
      return cleanUrl;
    }

    return '';
  }
}