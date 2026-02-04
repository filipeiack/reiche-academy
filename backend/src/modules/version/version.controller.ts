import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

interface VersionInfo {
  version: string;
  buildDate: string;
  commit: string;
  environment: string;
  uptime: number;
  timestamp: string;
}

@ApiTags('System')
@Controller('version')
export class VersionController {
  private readonly startTime = Date.now();

  @Get()
  @ApiOperation({
    summary: 'Obter informações de versão do deploy',
    description: 'Retorna versão, commit, data de build e uptime da aplicação',
  })
  getVersion(): VersionInfo {
    return {
      version: process.env.BUILD_VERSION || 'dev',
      buildDate: process.env.BUILD_DATE || 'unknown',
      commit: process.env.GIT_COMMIT || 'unknown',
      environment: process.env.DEPLOY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
