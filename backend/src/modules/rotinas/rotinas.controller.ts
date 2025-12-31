import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RotinasService } from './rotinas.service';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { UpdateRotinaDto } from './dto/update-rotina.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('rotinas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rotinas')
export class RotinasController {
  constructor(private readonly rotinasService: RotinasService) {}

  @Post()
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar nova rotina (e opcionalmente vincular a empresa via pilarEmpresaId)' })
  @ApiResponse({ status: 201, description: 'Rotina criada com sucesso' })
  create(@Body() createRotinaDto: CreateRotinaDto, @Request() req: ExpressRequest & { user: any }) {
    return this.rotinasService.create(createRotinaDto, req.user);
  }

  @Get()
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar todas as rotinas ativas' })
  @ApiQuery({ name: 'pilarId', required: false, description: 'Filtrar por pilar' })
  @ApiResponse({ status: 200, description: 'Lista de rotinas ordenada' })
  findAll(@Query('pilarId') pilarId?: string) {
    return this.rotinasService.findAll(pilarId);
  }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Buscar rotina por ID' })
  @ApiResponse({ status: 200, description: 'Rotina encontrada' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  findOne(@Param('id') id: string) {
    return this.rotinasService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Atualizar rotina' })
  @ApiResponse({ status: 200, description: 'Rotina atualizada' })
  update(
    @Param('id') id: string,
    @Body() updateRotinaDto: UpdateRotinaDto,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.rotinasService.update(id, updateRotinaDto, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Desativar rotina' })
  @ApiResponse({ status: 200, description: 'Rotina desativada' })
  remove(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.rotinasService.remove(id, req.user.id);
  }

  @Post('pilar/:pilarId/reordenar')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Reordenar rotinas de um pilar' })
  reordenar(
    @Param('pilarId') pilarId: string,
    @Body('ordens') ordens: { id: string; ordem: number }[],
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.rotinasService.reordenarPorPilar(pilarId, ordens, req.user.id);
  }
}
