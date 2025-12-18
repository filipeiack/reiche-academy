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
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PilaresService } from './pilares.service';
import { CreatePilarDto } from './dto/create-pilar.dto';
import { UpdatePilarDto } from './dto/update-pilar.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('pilares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pilares')
export class PilaresController {
  constructor(private readonly pilaresService: PilaresService) {}

  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Criar novo pilar' })
  @ApiResponse({ status: 201, description: 'Pilar criado com sucesso' })
  create(@Body() createPilarDto: CreatePilarDto, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.pilaresService.create(createPilarDto, req.user.id);
  }

  @Get()
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar todos os pilares ativos' })
  @ApiResponse({ status: 200, description: 'Lista de pilares ordenada' })
  findAll() {
    return this.pilaresService.findAll();
  }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Buscar pilar por ID com suas rotinas' })
  @ApiResponse({ status: 200, description: 'Pilar encontrado' })
  @ApiResponse({ status: 404, description: 'Pilar não encontrado' })
  findOne(@Param('id') id: string) {
    return this.pilaresService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Atualizar pilar' })
  @ApiResponse({ status: 200, description: 'Pilar atualizado' })
  update(
    @Param('id') id: string,
    @Body() updatePilarDto: UpdatePilarDto,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.pilaresService.update(id, updatePilarDto, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Desativar pilar' })
  @ApiResponse({ status: 200, description: 'Pilar desativado' })
  @ApiResponse({ status: 404, description: 'Pilar não encontrado' })
  remove(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.pilaresService.remove(id, req.user.id);
  }

  @Post('reordenar')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Reordenar pilares' })
  reordenar(
    @Body('ordens') ordens: { id: string; ordem: number }[],
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.pilaresService.reordenar(ordens, req.user.id);
  }
}
