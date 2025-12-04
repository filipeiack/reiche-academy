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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RotinasService } from './rotinas.service';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { UpdateRotinaDto } from './dto/update-rotina.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('rotinas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rotinas')
export class RotinasController {
  constructor(private readonly rotinasService: RotinasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova rotina' })
  @ApiResponse({ status: 201, description: 'Rotina criada com sucesso' })
  @ApiResponse({ status: 404, description: 'Pilar não encontrado' })
  create(@Body() createRotinaDto: CreateRotinaDto, @Request() req) {
    return this.rotinasService.create(createRotinaDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as rotinas ativas' })
  @ApiQuery({ name: 'pilarId', required: false, description: 'Filtrar por pilar' })
  @ApiResponse({ status: 200, description: 'Lista de rotinas ordenada' })
  findAll(@Query('pilarId') pilarId?: string) {
    return this.rotinasService.findAll(pilarId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar rotina por ID' })
  @ApiResponse({ status: 200, description: 'Rotina encontrada' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  findOne(@Param('id') id: string) {
    return this.rotinasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar rotina' })
  @ApiResponse({ status: 200, description: 'Rotina atualizada' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateRotinaDto: UpdateRotinaDto,
    @Request() req,
  ) {
    return this.rotinasService.update(id, updateRotinaDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar rotina' })
  @ApiResponse({ status: 200, description: 'Rotina desativada' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  remove(@Param('id') id: string, @Request() req) {
    return this.rotinasService.remove(id, req.user.id);
  }

  @Post('pilar/:pilarId/reordenar')
  @ApiOperation({ summary: 'Reordenar rotinas de um pilar' })
  @ApiResponse({ status: 200, description: 'Rotinas reordenadas' })
  reordenar(
    @Param('pilarId') pilarId: string,
    @Body('ordens') ordens: { id: string; ordem: number }[],
    @Request() req,
  ) {
    return this.rotinasService.reordenarPorPilar(pilarId, ordens, req.user.id);
  }
}
