import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { formatIsoSaoPaulo } from '../../common/utils/timezone';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: formatIsoSaoPaulo(new Date()),
    };
  }
}