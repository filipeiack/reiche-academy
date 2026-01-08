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
import { DefinirResponsavelDto } from './dto/definir-responsavel.dto';
import { ReordenarRotinasDto } from './dto/reordenar-rotinas.dto';
import { CreatePilarEmpresaDto } from './dto/create-pilar-empresa.dto';
import { CreateRotinaEmpresaDto } from '../rotinas/dto/create-rotina-empresa.dto';
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

  @Post()
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar pilar personalizado para empresa (Snapshot Pattern: template OU nome próprio)' })
  @ApiResponse({ status: 201, description: 'Pilar criado com sucesso (snapshot de template ou pilar customizado)' })
  @ApiResponse({ status: 400, description: 'XOR violation: deve fornecer pilarTemplateId OU nome (nunca ambos, nunca nenhum)' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Template não encontrado ou inativo' })
  @ApiResponse({ status: 409, description: 'Nome duplicado para esta empresa' })
  createPilarEmpresa(
    @Param('empresaId') empresaId: string,
    @Body() dto: CreatePilarEmpresaDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.createPilarEmpresa(empresaId, dto, req.user);
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

  @Delete(':pilarEmpresaId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Remover um pilar de uma empresa (hard delete com cascade audit)' })
  @ApiResponse({ status: 200, description: 'Pilar removido com sucesso (e rotinas associadas excluídas)' })
  @ApiResponse({ status: 400, description: 'Pilar possui rotinas ativas (R-PILEMP-006)' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar não encontrado ou já removido' })
  deletePilarEmpresa(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.deletePilarEmpresa(empresaId, pilarEmpresaId, req.user);
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
  @ApiOperation({ summary: 'Criar rotina personalizada para pilar (Snapshot Pattern: template OU nome próprio)' })
  @ApiResponse({ status: 201, description: 'Rotina criada com sucesso (snapshot de template ou rotina customizada)' })
  @ApiResponse({ status: 400, description: 'XOR violation: deve fornecer rotinaTemplateId OU nome (nunca ambos, nunca nenhum)' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar ou template não encontrados' })
  @ApiResponse({ status: 409, description: 'Nome duplicado para este pilar' })
  createRotinaEmpresa(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Body() dto: CreateRotinaEmpresaDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.createRotinaEmpresa(empresaId, pilarEmpresaId, dto, req.user);
  }

  @Delete('rotinas/:rotinaEmpresaId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Remover uma rotina de um pilar (hard delete com cascade audit)' })
  @ApiResponse({ status: 200, description: 'Rotina removida com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  deleteRotinaEmpresa(
    @Param('empresaId') empresaId: string,
    @Param('rotinaEmpresaId') rotinaEmpresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.pilaresEmpresaService.deleteRotinaEmpresa(empresaId, rotinaEmpresaId, req.user);
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
