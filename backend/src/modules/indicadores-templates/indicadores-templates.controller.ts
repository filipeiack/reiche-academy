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
import { IndicadoresTemplatesService } from './indicadores-templates.service';
import { CreateIndicadorTemplateDto } from './dto/create-indicador-template.dto';
import { UpdateIndicadorTemplateDto } from './dto/update-indicador-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('indicadores-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('indicadores-templates')
export class IndicadoresTemplatesController {
  constructor(private readonly indicadoresTemplatesService: IndicadoresTemplatesService) {}

  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Criar indicador template' })
  @ApiResponse({ status: 201, description: 'Indicador template criado com sucesso' })
  create(
    @Body() dto: CreateIndicadorTemplateDto,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.indicadoresTemplatesService.create(dto, req.user);
  }

  @Get()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Listar indicadores templates ativos' })
  @ApiQuery({ name: 'pilarId', required: false, description: 'Filtrar por pilar template' })
  @ApiResponse({ status: 200, description: 'Lista de indicadores templates' })
  findAll(@Query('pilarId') pilarId?: string) {
    return this.indicadoresTemplatesService.findAll(pilarId);
  }

  @Get(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Buscar indicador template por ID' })
  @ApiResponse({ status: 200, description: 'Indicador template encontrado' })
  @ApiResponse({ status: 404, description: 'Indicador template não encontrado' })
  findOne(@Param('id') id: string) {
    return this.indicadoresTemplatesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Atualizar indicador template' })
  @ApiResponse({ status: 200, description: 'Indicador template atualizado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIndicadorTemplateDto,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.indicadoresTemplatesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Desativar indicador template' })
  @ApiResponse({ status: 200, description: 'Indicador template desativado' })
  remove(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.indicadoresTemplatesService.remove(id, req.user.id);
  }
}
