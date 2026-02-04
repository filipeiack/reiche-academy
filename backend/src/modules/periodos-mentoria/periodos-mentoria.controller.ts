import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PeriodosMentoriaService } from './periodos-mentoria.service';
import { CreatePeriodoMentoriaDto } from './dto/create-periodo-mentoria.dto';
import { RenovarPeriodoMentoriaDto } from './dto/renovar-periodo-mentoria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

@Controller('empresas/:empresaId/periodos-mentoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodosMentoriaController {
  constructor(private readonly service: PeriodosMentoriaService) {}

  /**
   * POST /empresas/:id/periodos-mentoria
   * Criar período de mentoria (ADMINISTRADOR)
   */
  @Post()
  @Roles('ADMINISTRADOR')
  async create(
    @Param('empresaId') empresaId: string,
    @Body() dto: CreatePeriodoMentoriaDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.service.create(empresaId, dto, user?.id);
  }

  /**
   * GET /empresas/:id/periodos-mentoria
   * Listar histórico de períodos
   */
  @Get()
  async findAll(@Param('empresaId') empresaId: string) {
    return this.service.findByEmpresa(empresaId);
  }

  /**
   * GET /empresas/:id/periodos-mentoria/ativo
   * Buscar período ativo
   */
  @Get('ativo')
  async findAtivo(@Param('empresaId') empresaId: string) {
    return this.service.findAtivo(empresaId);
  }

  /**
   * POST /empresas/:id/periodos-mentoria/:periodoId/renovar
   * Renovar período de mentoria (ADMINISTRADOR)
   */
  @Post(':periodoId/renovar')
  @Roles('ADMINISTRADOR')
  async renovar(
    @Param('empresaId') empresaId: string,
    @Param('periodoId') periodoId: string,
    @Body() dto: RenovarPeriodoMentoriaDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.service.renovar(empresaId, periodoId, dto, user?.id);
  }

  /**
   * POST /empresas/:id/periodos-mentoria/:periodoId/encerrar
   * Encerrar período de mentoria (ADMINISTRADOR)
   */
  @Post(':periodoId/encerrar')
  @Roles('ADMINISTRADOR')
  async encerrar(
    @Param('empresaId') empresaId: string,
    @Param('periodoId') periodoId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.service.encerrar(empresaId, periodoId, user?.id);
  }
}
