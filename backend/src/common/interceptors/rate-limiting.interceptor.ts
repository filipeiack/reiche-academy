import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class RateLimitingInterceptor implements NestInterceptor {
  constructor(private readonly rateLimitService: RateLimitService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Determine rate limit based on endpoint
    const limitConfig = this.getLimitConfig(request);
    const key = this.rateLimitService.generateKey(request, request.route?.path);

    const { allowed, resetTime } = this.rateLimitService.checkLimit(
      key,
      limitConfig.limit,
      limitConfig.windowMs
    );

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', limitConfig.limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limitConfig.limit - (allowed ? 1 : 0)));
    response.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    if (!allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return next.handle();
  }

  private getLimitConfig(request: any): { limit: number; windowMs: number } {
    const path = request.path;
    const method = request.method;

    // Authentication endpoints
    if (path.includes('/auth/login')) {
      return this.rateLimitService.limits.auth.login;
    }
    if (path.includes('/auth/register')) {
      return this.rateLimitService.limits.auth.register;
    }
    if (path.includes('/auth/forgot')) {
      return this.rateLimitService.limits.auth.forgot;
    }
    if (path.includes('/auth/reset')) {
      return this.rateLimitService.limits.auth.reset;
    }

    // Sensitive operations (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return this.rateLimitService.limits.sensitive;
    }

    // General API endpoints
    return this.rateLimitService.limits.general;
  }
}