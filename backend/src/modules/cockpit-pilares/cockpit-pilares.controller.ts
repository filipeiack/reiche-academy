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
import { CreateProcessoFluxogramaDto } from './dto/create-processo-fluxograma.dto';
import { UpdateProcessoFluxogramaDto } from './dto/update-processo-fluxograma.dto';
import { ReordenarProcessoFluxogramaDto } from './dto/reordenar-processo-fluxograma.dto';
import { CreateCargoCockpitDto } from './dto/create-cargo-cockpit.dto';
import { UpdateCargoCockpitDto } from './dto/update-cargo-cockpit.dto';
import { CreateFuncaoCargoDto } from './dto/create-funcao-cargo.dto';
import { UpdateFuncaoCargoDto } from './dto/update-funcao-cargo.dto';
import { CreateAcaoCockpitDto } from './dto/create-acao-cockpit.dto';
import { UpdateAcaoCockpitDto } from './dto/update-acao-cockpit.dto';
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
    summary: 'Criar indicador (auto-cria 12 meses consecutivos)',
  })
  @ApiResponse({
    status: 201,
    description: 'Indicador criado com 12 meses vazios',
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

  @Post('cockpits/:cockpitId/meses/ciclo')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ 
    summary: 'Criar novo ciclo de 12 meses para todos os indicadores do cockpit',
    description: 'Validação: só pode criar se mês atual >= último mês do período de mentoria ativo'
  })
  @ApiResponse({
    status: 201,
    description: 'Novo ciclo criado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Período de mentoria ainda não encerrou ou não existe' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  criarNovoCicloMeses(
    @Param('cockpitId') cockpitId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.criarNovoCicloMeses(cockpitId, req.user);
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

  // ==================== CARGOS E FUNÇÕES ====================

  @Get('cockpits/:cockpitId/cargos')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar cargos e funções do cockpit' })
  @ApiResponse({ status: 200, description: 'Lista de cargos do cockpit' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  getCargosByCockpit(
    @Param('cockpitId') cockpitId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.getCargosByCockpit(cockpitId, req.user);
  }

  @Post('cockpits/:cockpitId/cargos')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar cargo no cockpit' })
  @ApiResponse({ status: 201, description: 'Cargo criado com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  createCargo(
    @Param('cockpitId') cockpitId: string,
    @Body() dto: CreateCargoCockpitDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.createCargo(cockpitId, dto, req.user);
  }

  @Patch('cargos/:cargoId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Atualizar cargo do cockpit' })
  @ApiResponse({ status: 200, description: 'Cargo atualizado com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cargo não encontrado' })
  updateCargo(
    @Param('cargoId') cargoId: string,
    @Body() dto: UpdateCargoCockpitDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.updateCargo(cargoId, dto, req.user);
  }

  @Delete('cargos/:cargoId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Excluir cargo do cockpit (hard delete)' })
  @ApiResponse({ status: 200, description: 'Cargo removido com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cargo não encontrado' })
  deleteCargo(
    @Param('cargoId') cargoId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.deleteCargo(cargoId, req.user);
  }

  @Post('cargos/:cargoId/funcoes')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar função para um cargo' })
  @ApiResponse({ status: 201, description: 'Função criada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cargo não encontrado' })
  createFuncao(
    @Param('cargoId') cargoId: string,
    @Body() dto: CreateFuncaoCargoDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.createFuncaoCargo(
      cargoId,
      dto,
      req.user,
    );
  }

  @Patch('funcoes/:funcaoId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Atualizar função do cargo' })
  @ApiResponse({ status: 200, description: 'Função atualizada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Função não encontrada' })
  updateFuncao(
    @Param('funcaoId') funcaoId: string,
    @Body() dto: UpdateFuncaoCargoDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.updateFuncaoCargo(
      funcaoId,
      dto,
      req.user,
    );
  }

  @Delete('funcoes/:funcaoId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Excluir função do cargo (hard delete)' })
  @ApiResponse({ status: 200, description: 'Função removida com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Função não encontrada' })
  deleteFuncao(
    @Param('funcaoId') funcaoId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.deleteFuncaoCargo(funcaoId, req.user);
  }

  // ==================== PLANO DE AÇÃO ESPECÍFICO ====================

  @Get('cockpits/:cockpitId/acoes')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar ações do cockpit' })
  @ApiResponse({ status: 200, description: 'Lista de ações do cockpit' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  getAcoesCockpit(
    @Param('cockpitId') cockpitId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.getAcoesCockpit(cockpitId, req.user);
  }

  @Post('cockpits/:cockpitId/acoes')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar ação no cockpit' })
  @ApiResponse({ status: 201, description: 'Ação criada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit ou indicador não encontrado' })
  createAcaoCockpit(
    @Param('cockpitId') cockpitId: string,
    @Body() dto: CreateAcaoCockpitDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.createAcaoCockpit(
      cockpitId,
      dto,
      req.user,
    );
  }

  @Patch('acoes-cockpit/:acaoId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Atualizar ação do cockpit' })
  @ApiResponse({ status: 200, description: 'Ação atualizada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Ação não encontrada' })
  updateAcaoCockpit(
    @Param('acaoId') acaoId: string,
    @Body() dto: UpdateAcaoCockpitDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.updateAcaoCockpit(
      acaoId,
      dto,
      req.user,
    );
  }

  @Delete('acoes-cockpit/:acaoId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Excluir ação do cockpit (hard delete)' })
  @ApiResponse({ status: 200, description: 'Ação removida com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Ação não encontrada' })
  deleteAcaoCockpit(
    @Param('acaoId') acaoId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.deleteAcaoCockpit(acaoId, req.user);
  }

  // ==================== FLUXOGRAMA DE PROCESSOS ====================

  @Get('processos-prioritarios/:processoId/fluxograma')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar ações do fluxograma de um processo prioritário' })
  @ApiResponse({ status: 200, description: 'Lista de ações do fluxograma' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Processo prioritário não encontrado' })
  getProcessoFluxograma(
    @Param('processoId') processoId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.getProcessoFluxograma(
      processoId,
      req.user,
    );
  }

  @Post('processos-prioritarios/:processoId/fluxograma')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Criar ação no fluxograma de um processo prioritário' })
  @ApiResponse({ status: 201, description: 'Ação criada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Processo prioritário não encontrado' })
  createProcessoFluxograma(
    @Param('processoId') processoId: string,
    @Body() dto: CreateProcessoFluxogramaDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.createProcessoFluxograma(
      processoId,
      dto,
      req.user,
    );
  }

  @Patch('processos-prioritarios/:processoId/fluxograma/reordenar')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Reordenar ações do fluxograma de um processo prioritário' })
  @ApiResponse({ status: 200, description: 'Ações reordenadas com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Processo prioritário não encontrado' })
  reordenarProcessoFluxograma(
    @Param('processoId') processoId: string,
    @Body() dto: ReordenarProcessoFluxogramaDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.reordenarProcessoFluxograma(
      processoId,
      dto,
      req.user,
    );
  }

  @Patch('processos-prioritarios/:processoId/fluxograma/:acaoId')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Atualizar ação do fluxograma de um processo prioritário' })
  @ApiResponse({ status: 200, description: 'Ação atualizada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Ação não encontrada' })
  updateProcessoFluxograma(
    @Param('processoId') processoId: string,
    @Param('acaoId') acaoId: string,
    @Body() dto: UpdateProcessoFluxogramaDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.updateProcessoFluxograma(
      processoId,
      acaoId,
      dto,
      req.user,
    );
  }

  @Delete('processos-prioritarios/:processoId/fluxograma/:acaoId')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Remover ação do fluxograma de um processo prioritário' })
  @ApiResponse({ status: 200, description: 'Ação removida com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Ação não encontrada' })
  deleteProcessoFluxograma(
    @Param('processoId') processoId: string,
    @Param('acaoId') acaoId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.deleteProcessoFluxograma(
      processoId,
      acaoId,
      req.user,
    );
  }

  // ==================== GRÁFICOS ====================

  @Get('cockpits/:cockpitId/anos-disponiveis')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({
    summary: 'Buscar anos disponíveis (com meses criados) para um cockpit',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de anos disponíveis',
    schema: {
      example: [2025, 2026, 2027],
    },
  })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Cockpit não encontrado' })
  getAnosDisponiveis(
    @Param('cockpitId') cockpitId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.getAnosDisponiveis(cockpitId, req.user);
  }

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
    @Query('filtro') filtro: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.cockpitPilaresService.getDadosGraficos(
      cockpitId,
      filtro,
      req.user,
    );
  }
}
