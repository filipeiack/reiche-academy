import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RequestUser } from '../../common/interfaces/request-user.interface';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitService {
  private readonly rateLimits = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval: NodeJS.Timeout;
  private rateLimitEnabled: boolean;
  private readonly limitsConfig: {
    auth: {
      login: { limit: number; windowMs: number };
      register: { limit: number; windowMs: number };
      forgot: { limit: number; windowMs: number };
      reset: { limit: number; windowMs: number };
    };
    general: { limit: number; windowMs: number };
    sensitive: { limit: number; windowMs: number };
  };

  constructor(private readonly configService: ConfigService) {
    this.rateLimitEnabled = this.parseBoolean(
      this.configService.get<string>('RATE_LIMIT_ENABLED'),
      true
    );

    const overrideLimit = this.parseNumber(this.configService.get<string>('RATE_LIMIT_MAX'));
    const overrideWindowMs = this.parseNumber(this.configService.get<string>('RATE_LIMIT_WINDOW_MS'));

    const applyOverride = (limit: number, windowMs: number) => ({
      limit: overrideLimit ?? limit,
      windowMs: overrideWindowMs ?? windowMs,
    });

    this.limitsConfig = {
      auth: {
        login: applyOverride(5, 900000),
        register: applyOverride(3, 3600000),
        forgot: applyOverride(3, 3600000),
        reset: applyOverride(3, 3600000),
      },
      general: applyOverride(100, 60000),
      sensitive: applyOverride(20, 60000),
    };

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  checkLimit(key: string, limit: number, windowMs: number = 60000): { allowed: boolean; resetTime: number } {
    const now = Date.now();
    const entry = this.rateLimits.get(key);

    if (!entry || now > entry.resetTime) {
      // New window
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      };
      this.rateLimits.set(key, newEntry);
      return { allowed: true, resetTime: newEntry.resetTime };
    }

    // Existing window
    if (entry.count >= limit) {
      return { allowed: false, resetTime: entry.resetTime };
    }

    entry.count++;
    return { allowed: true, resetTime: entry.resetTime };
  }

  isEnabled(): boolean {
    return this.rateLimitEnabled;
  }

  setEnabled(enabled: boolean): void {
    this.rateLimitEnabled = enabled;
  }

  generateKey(request: Request, endpoint?: string): string {
    const ip = this.getClientIP(request);
    const user = request.user as RequestUser | undefined;
    const userId = user?.id || 'anonymous';
    const path = endpoint || request.route?.path || request.path;
    return `${request.method}:${path}:${ip}:${userId}`;
  }

  private getClientIP(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimits.entries()) {
      if (now > entry.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }

  // Different limits for different scenarios
  getLimits() {
    return this.limitsConfig;
  }

  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    return ['true', '1', 'yes', 'y', 'on'].includes(value.toLowerCase());
  }

  private parseNumber(value: string | undefined): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}