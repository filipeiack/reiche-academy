import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ObjetivosTemplatesService } from './objetivos-templates.service';
import { CreateObjetivoTemplateDto } from './dto/create-objetivo-template.dto';
import { UpdateObjetivoTemplateDto } from './dto/update-objetivo-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('objetivos-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('objetivos-templates')
export class ObjetivosTemplatesController {
  constructor(private readonly objetivosTemplatesService: ObjetivosTemplatesService) {}

  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Criar objetivo template' })
  @ApiResponse({ status: 201, description: 'Objetivo template criado com sucesso' })
  create(
    @Body() dto: CreateObjetivoTemplateDto,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.objetivosTemplatesService.create(dto, req.user);
  }

  @Get()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Listar objetivos templates' })
  @ApiQuery({ name: 'pilarId', required: false, description: 'Filtrar por pilar template' })
  @ApiResponse({ status: 200, description: 'Lista de objetivos templates' })
  findAll(@Query('pilarId') pilarId?: string) {
    return this.objetivosTemplatesService.findAll(pilarId);
  }

  @Get(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Buscar objetivo template por ID' })
  @ApiResponse({ status: 200, description: 'Objetivo template encontrado' })
  @ApiResponse({ status: 404, description: 'Objetivo template não encontrado' })
  findOne(@Param('id') id: string) {
    return this.objetivosTemplatesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Atualizar objetivo template' })
  @ApiResponse({ status: 200, description: 'Objetivo template atualizado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateObjetivoTemplateDto,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.objetivosTemplatesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Excluir objetivo template' })
  @ApiResponse({ status: 200, description: 'Objetivo template excluído' })
  remove(@Param('id') id: string) {
    return this.objetivosTemplatesService.remove(id);
  }
}
