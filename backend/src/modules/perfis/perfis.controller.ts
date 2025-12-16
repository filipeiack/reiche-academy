import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PerfisService } from './perfis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('perfis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('perfis')
export class PerfisController {
  constructor(private readonly perfisService: PerfisService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os perfis de usuário disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de perfis ordenada por hierarquia' })
  findAll() {
    return this.perfisService.findAll();
  }
}
