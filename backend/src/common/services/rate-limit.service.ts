import { Injectable, Inject } from '@nestjs/common';
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

  constructor() {
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
  readonly limits = {
    // Authentication endpoints - more restrictive
    auth: {
      login: { limit: 5, windowMs: 900000 }, // 5 attempts per 15 minutes
      register: { limit: 3, windowMs: 3600000 }, // 3 attempts per hour
      forgot: { limit: 3, windowMs: 3600000 }, // 3 attempts per hour
    },
    // General API endpoints
    general: { limit: 100, windowMs: 60000 }, // 100 requests per minute
    // Sensitive operations
    sensitive: { limit: 20, windowMs: 60000 }, // 20 requests per minute
  };
}