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
import { RotinasEmpresaService } from './rotinas-empresa.service';
import { ReordenarRotinasDto } from './dto/reordenar-rotinas.dto';
import { CreateRotinaEmpresaDto } from '../rotinas/dto/create-rotina-empresa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('rotinas-empresa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empresas/:empresaId/pilares/:pilarEmpresaId/rotinas')
export class RotinasEmpresaController {
  constructor(private readonly rotinasEmpresaService: RotinasEmpresaService) {}

  @Get()
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar rotinas vinculadas a um pilar da empresa' })
  @ApiResponse({ status: 200, description: 'Lista de rotinas do pilar ordenada' })
  findAll(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.rotinasEmpresaService.listarRotinas(empresaId, pilarEmpresaId, req.user);
  }

  @Post()
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar rotina personalizada para pilar (Snapshot Pattern: template OU nome próprio)' })
  @ApiResponse({ status: 201, description: 'Rotina criada com sucesso (snapshot de template ou rotina customizada)' })
  @ApiResponse({ status: 400, description: 'XOR violation: deve fornecer rotinaTemplateId OU nome (nunca ambos, nunca nenhum)' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar ou template não encontrados' })
  @ApiResponse({ status: 409, description: 'Nome duplicado para este pilar' })
  create(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Body() dto: CreateRotinaEmpresaDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.rotinasEmpresaService.createRotinaEmpresa(empresaId, pilarEmpresaId, dto, req.user);
  }

  @Delete(':rotinaEmpresaId')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Remover uma rotina de um pilar (hard delete com cascade audit)' })
  @ApiResponse({ status: 200, description: 'Rotina removida com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  remove(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Param('rotinaEmpresaId') rotinaEmpresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.rotinasEmpresaService.deleteRotinaEmpresa(empresaId, rotinaEmpresaId, req.user);
  }

  @Patch('reordenar')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Reordenar rotinas de um pilar da empresa' })
  @ApiResponse({ status: 200, description: 'Rotinas reordenadas com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (multi-tenant)' })
  @ApiResponse({ status: 404, description: 'Pilar ou rotinas não encontrados' })
  reordenar(
    @Param('empresaId') empresaId: string,
    @Param('pilarEmpresaId') pilarEmpresaId: string,
    @Body() dto: ReordenarRotinasDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.rotinasEmpresaService.reordenarRotinas(
      empresaId,
      pilarEmpresaId,
      dto.ordens,
      req.user
    );
  }
}
