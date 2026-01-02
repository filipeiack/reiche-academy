import {
  Controller,
  Get,
  Post,
  Patch,
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
import { DefinirResponsavelDto } from './dto/definir-responsavel.dto';
import { VincularRotinaDto } from './dto/vincular-rotina.dto';
import { ReordenarRotinasDto } from './dto/reordenar-rotinas.dto';
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
  @ApiOperation({ summary: 'Remover um pilar de uma empresa' })
  @ApiResponse({ status: 200, description: 'Pilar removido com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar não encontrado ou já removido' })
  remover(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.remover(empresaId, pilarEmpresaId, req.user);
  }

  @Patch(':pilarEmpresaId/responsavel')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Definir ou remover responsável de um pilar da empresa' })
  @ApiResponse({ status: 200, description: 'Responsável definido com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar ou responsável não encontrado' })
  definirResponsavel(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Body() dto: DefinirResponsavelDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.definirResponsavel(
      empresaId, 
      pilarEmpresaId, 
      dto.responsavelId ?? null, 
      req.user
    );
  }

  @Get(':pilarEmpresaId/rotinas')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar rotinas vinculadas a um pilar da empresa' })
  @ApiResponse({ status: 200, description: 'Lista de rotinas do pilar ordenada' })
  listarRotinas(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.listarRotinas(empresaId, pilarEmpresaId, req.user);
  }

  @Post(':pilarEmpresaId/rotinas')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Vincular uma rotina a um pilar da empresa' })
  @ApiResponse({ status: 201, description: 'Rotina vinculada com sucesso' })
  @ApiResponse({ status: 400, description: 'Rotina já vinculada ou não pertence ao pilar' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar ou rotina não encontrados' })
  vincularRotina(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Body() dto: VincularRotinaDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.vincularRotina(
      empresaId,
      pilarEmpresaId,
      dto.rotinaId,
      dto.ordem,
      req.user
    );
  }

  @Delete('rotinas/:rotinaEmpresaId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Remover uma rotina de um pilar da empresa' })
  @ApiResponse({ status: 200, description: 'Rotina removida com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  removerRotina(
    @Param('empresaId') empresaId: string,
    @Param('rotinaEmpresaId') rotinaEmpresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.removerRotina(empresaId, rotinaEmpresaId, req.user);
  }

  @Patch(':pilarEmpresaId/rotinas/reordenar')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Reordenar rotinas de um pilar da empresa' })
  @ApiResponse({ status: 200, description: 'Rotinas reordenadas com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar ou rotinas não encontrados' })
  reordenarRotinas(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Body() dto: ReordenarRotinasDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.reordenarRotinas(
      empresaId,
      pilarEmpresaId,
      dto.ordens,
      req.user
    );
  }
}
