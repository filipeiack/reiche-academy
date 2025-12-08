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

@ApiTags('pilares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pilares')
export class PilaresController {
  constructor(private readonly pilaresService: PilaresService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo pilar' })
  @ApiResponse({ status: 201, description: 'Pilar criado com sucesso' })
  create(@Body() createPilarDto: CreatePilarDto, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.pilaresService.create(createPilarDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os pilares ativos' })
  @ApiResponse({ status: 200, description: 'Lista de pilares ordenada' })
  findAll() {
    return this.pilaresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pilar por ID com suas rotinas' })
  @ApiResponse({ status: 200, description: 'Pilar encontrado' })
  @ApiResponse({ status: 404, description: 'Pilar não encontrado' })
  findOne(@Param('id') id: string) {
    return this.pilaresService.findOne(id);
  }

  @Patch(':id')
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
  @ApiOperation({ summary: 'Desativar pilar' })
  @ApiResponse({ status: 200, description: 'Pilar desativado' })
  @ApiResponse({ status: 404, description: 'Pilar não encontrado' })
  remove(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.pilaresService.remove(id, req.user.id);
  }

  @Post('reordenar')
  @ApiOperation({ summary: 'Reordenar pilares' })
  reordenar(
    @Body('ordens') ordens: { id: string; ordem: number }[],
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.pilaresService.reordenar(ordens, req.user.id);
  }
}
