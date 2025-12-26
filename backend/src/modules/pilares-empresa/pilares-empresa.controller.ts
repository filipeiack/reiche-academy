import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PilaresEmpresaService } from './pilares-empresa.service';
import { ReordenarPilaresDto } from './dto/reordenar-pilares.dto';
import { VincularPilaresDto } from './dto/vincular-pilares.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('pilares-empresa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empresas/:empresaId/pilares')
export class PilaresEmpresaController {
  constructor(private readonly pilaresEmpresaService: PilaresEmpresaService) {}

  @Get()
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar pilares ativos de uma empresa (ordenados por PilarEmpresa.ordem)' })
  @ApiResponse({ status: 200, description: 'Lista de pilares da empresa ordenada' })
  findAll(
    @Param('empresaId') empresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.findByEmpresa(empresaId, req.user);
  }

  @Post('reordenar')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Reordenar pilares de uma empresa específica' })
  @ApiResponse({ status: 200, description: 'Pilares reordenados com sucesso' })
  reordenar(
    @Param('empresaId') empresaId: string,
    @Body() reordenarDto: ReordenarPilaresDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.reordenar(empresaId, reordenarDto.ordens, req.user);
  }

  @Post('vincular')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Vincular pilares a uma empresa (adição incremental)' })
  @ApiResponse({ status: 200, description: 'Pilares vinculados com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilares não encontrados ou inativos' })
  vincular(
    @Param('empresaId') empresaId: string,
    @Body() vincularDto: VincularPilaresDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.vincularPilares(empresaId, vincularDto.pilaresIds, req.user);
  }

  @Delete(':pilarEmpresaId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Desassociar um pilar de uma empresa (soft delete)' })
  @ApiResponse({ status: 200, description: 'Pilar desassociado com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar não encontrado ou já desassociado' })
  desassociar(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.desassociar(empresaId, pilarEmpresaId, req.user);
  }
}
