import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { formatIsoSaoPaulo } from '../../common/utils/timezone';
import { RateLimitService } from '../../common/services/rate-limit.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: formatIsoSaoPaulo(new Date()),
    };
  }

  @Post('rate-limit')
  @ApiOperation({ summary: 'Toggle rate limit (dev only)' })
  toggleRateLimit(@Body() body: { enabled: boolean }) {
    const env = this.configService.get<string>('NODE_ENV') || 'development';

    if (env !== 'development') {
      throw new NotFoundException();
    }

    this.rateLimitService.setEnabled(Boolean(body?.enabled));

    return {
      status: 'ok',
      enabled: this.rateLimitService.isEnabled(),
    };
  }
}