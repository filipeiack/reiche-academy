import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PeriodosAvaliacaoService } from './periodos-avaliacao.service';
import { CreatePeriodoAvaliacaoDto } from './dto/create-periodo-avaliacao.dto';

@ApiTags('Períodos de Avaliação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PeriodosAvaliacaoController {
  constructor(private readonly service: PeriodosAvaliacaoService) {}

  @Post('empresas/:empresaId/periodos-avaliacao')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar novo período de avaliação trimestral' })
  async create(
    @Param('empresaId') empresaId: string,
    @Body() dto: CreatePeriodoAvaliacaoDto,
    @Request() req: { user: RequestUser },
  ) {
    const user = req.user;
    return this.service.create(empresaId, dto, user);
  }

  @Post('periodos-avaliacao/:id/congelar')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @ApiOperation({ summary: 'Congelar médias do período (criar snapshots)' })
  async congelar(
    @Param('id') periodoId: string,
    @Request() req: { user: RequestUser },
  ) {
    const user = req.user;
    const result = await this.service.congelar(periodoId, user);
    return {
      message: 'Médias congeladas com sucesso',
      periodo: result.periodo,
      snapshots: result.snapshots,
    };
  }

  @Post('periodos-avaliacao/:id/recongelar')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @ApiOperation({ summary: 'Recongelar período já encerrado (atualizar snapshots)' })
  async recongelar(
    @Param('id') periodoId: string,
    @Request() req: { user: RequestUser },
  ) {
    const user = req.user;
    const result = await this.service.recongelar(periodoId, user);
    return {
      message: 'Período recongelado com sucesso',
      operacao: 'recongelamento',
      periodo: result.periodo,
      snapshotsNovos: result.snapshotsNovos,
      resumo: {
        totalSnapshots: result.snapshotsNovos.length,
        snapshotsSubstituidos: result.snapshotsAntigos.length,
      },
    };
  }

  @Get('empresas/:empresaId/periodos-avaliacao/atual')
  @ApiOperation({ summary: 'Buscar período aberto (se existir)' })
  async findAtual(
    @Param('empresaId') empresaId: string,
    @Request() req: { user: RequestUser },
  ) {
    const user = req.user;
    return this.service.findAtual(empresaId, user);
  }

  @Get('empresas/:empresaId/periodos-avaliacao')
  @ApiOperation({ summary: 'Listar histórico de períodos congelados' })
  async findAll(
    @Param('empresaId') empresaId: string,
    @Query('ano') ano?: string,
    @Request() req?: { user: RequestUser },
  ) {
    const anoNumber = ano ? parseInt(ano, 10) : undefined;
    const user = req?.user;
    return this.service.findAll(empresaId, anoNumber, user);
  }
}
