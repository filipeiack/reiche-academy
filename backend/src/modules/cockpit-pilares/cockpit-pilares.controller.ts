import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CockpitPilaresService } from './cockpit-pilares.service';
import { CreateCockpitPilarDto } from './dto/create-cockpit-pilar.dto';
import { UpdateCockpitPilarDto } from './dto/update-cockpit-pilar.dto';
import { CreateIndicadorCockpitDto } from './dto/create-indicador-cockpit.dto';
import { UpdateIndicadorCockpitDto } from './dto/update-indicador-cockpit.dto';
import { UpdateValoresMensaisDto } from './dto/update-valores-mensais.dto';
import { UpdateProcessoPrioritarioDto } from './dto/update-processo-prioritario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('cockpit-pilares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CockpitPilaresController {
  constructor(
    private readonly cockpitPilaresService: CockpitPilaresService,
  ) {}

  // ==================== COCKPITS ====================

  @Post('empresas/:empresaId/pilares/:pilarEmpresaId/cockpit')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({
    summary: 'Criar cockpit para um pilar (auto-vincula rotinas)',
  })
  @ApiResponse({
    status: 201,
    description: 'Cockpit criado com processos prioritários vinculados',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Este pilar já possui um cockpit',
  })
  createCockpit(
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Body() dto: CreateCockpitPilarDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    // Garantir que o pilarEmpresaId do DTO corresponde ao parâmetro
    dto.pilarEmpresaId = pilarEmpresaId;
    return this.cockpitPilaresService.createCockpit(dto, req.user);
  }

  @Get('empresas/:empresaId/cockpits')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar cockpits de uma empresa' })
  @ApiResponse({ status: 200, description: 'Lista de cockpits da empresa' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  getCockpitsByEmpresa(
    @Param('empresaId') empresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.getCockpitsByEmpresa(
      empresaId,
      req.user,
    );
  }

  @Get('cockpits/:cockpitId')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({
    summary:
      'Buscar cockpit por ID com indicadores, processos e valores mensais',
  })
  @ApiResponse({ status: 200, description: 'Cockpit encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  getCockpitById(
    @Param('cockpitId') cockpitId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.getCockpitById(cockpitId, req.user);
  }

  @Patch('cockpits/:cockpitId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({
    summary: 'Atualizar contexto do cockpit (entradas, saídas, missão)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cockpit atualizado com sucesso',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  updateCockpit(
    @Param('cockpitId') cockpitId: string,
    @Body() dto: UpdateCockpitPilarDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.updateCockpit(
      cockpitId,
      dto,
      req.user,
    );
  }

  @Delete('cockpits/:cockpitId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Desativar cockpit (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Cockpit desativado com sucesso',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  deleteCockpit(
    @Param('cockpitId') cockpitId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.deleteCockpit(cockpitId, req.user);
  }

  // ==================== INDICADORES ====================

  @Post('cockpits/:cockpitId/indicadores')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({
    summary: 'Criar indicador (auto-cria 13 meses jan-dez + anual)',
  })
  @ApiResponse({
    status: 201,
    description: 'Indicador criado com 13 meses vazios',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Já existe indicador com este nome neste cockpit',
  })
  createIndicador(
    @Param('cockpitId') cockpitId: string,
    @Body() dto: CreateIndicadorCockpitDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.createIndicador(
      cockpitId,
      dto,
      req.user,
    );
  }

  @Patch('indicadores/:indicadorId')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Atualizar propriedades do indicador' })
  @ApiResponse({
    status: 200,
    description: 'Indicador atualizado com sucesso',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Indicador não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Já existe indicador com este nome neste cockpit',
  })
  updateIndicador(
    @Param('indicadorId') indicadorId: string,
    @Body() dto: UpdateIndicadorCockpitDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.updateIndicador(
      indicadorId,
      dto,
      req.user,
    );
  }

  @Delete('indicadores/:indicadorId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Desativar indicador (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Indicador desativado com sucesso',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Indicador não encontrado' })
  deleteIndicador(
    @Param('indicadorId') indicadorId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.deleteIndicador(indicadorId, req.user);
  }

  @Patch('indicadores/:indicadorId/meses')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Batch update de valores mensais (meta/realizado)' })
  @ApiResponse({
    status: 200,
    description: 'Valores mensais atualizados com sucesso',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Indicador não encontrado' })
  updateValoresMensais(
    @Param('indicadorId') indicadorId: string,
    @Body() dto: UpdateValoresMensaisDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.updateValoresMensais(
      indicadorId,
      dto,
      req.user,
    );
  }

  @Get('indicadores/:indicadorId/meses')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Buscar valores mensais de um indicador por ano' })
  @ApiResponse({ status: 200, description: 'Lista de meses do indicador' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Indicador não encontrado' })
  getMesesIndicador(
    @Param('indicadorId') indicadorId: string,
    @Query('ano', ParseIntPipe) ano: number,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.getMesesIndicador(
      indicadorId,
      ano,
      req.user,
    );
  }

  // ==================== PROCESSOS PRIORITÁRIOS ====================

  @Get('cockpits/:cockpitId/processos')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({
    summary:
      'Listar processos prioritários do cockpit (com JOIN para nome/criticidade/nota)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de processos prioritários',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  getProcessosPrioritarios(
    @Param('cockpitId') cockpitId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.getProcessosPrioritarios(
      cockpitId,
      req.user,
    );
  }

  @Patch('processos-prioritarios/:processoId')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({
    summary: 'Atualizar status de processo prioritário (mapeamento/treinamento)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado com sucesso',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({
    status: 404,
    description: 'Processo prioritário não encontrado',
  })
  updateProcessoPrioritario(
    @Param('processoId') processoId: string,
    @Body() dto: UpdateProcessoPrioritarioDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.updateProcessoPrioritario(
      processoId,
      dto,
      req.user,
    );
  }

  // ==================== GRÁFICOS ====================

  @Get('cockpits/:cockpitId/graficos/dados')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({
    summary: 'Buscar dados agregados para gráficos (indicadores com meses)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados agregados para gráficos',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  getDadosGraficos(
    @Param('cockpitId') cockpitId: string,
    @Query('ano', ParseIntPipe) ano: number,
    @Request() req: ExpressRequest & { user: any },
  ) {
    const anoAtual = ano || new Date().getFullYear();
    return this.cockpitPilaresService.getDadosGraficos(
      cockpitId,
      anoAtual,
      req.user,
    );
  }
}
