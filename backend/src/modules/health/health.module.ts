import { Module } from '@nestjs/common';
import { RateLimitService } from '../../common/services/rate-limit.service';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [RateLimitService],
})
export class HealthModule {}