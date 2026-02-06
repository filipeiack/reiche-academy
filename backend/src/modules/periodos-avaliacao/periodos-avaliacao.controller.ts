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
import { PrimeiraDataDto } from './dto/primeira-data.dto';
import { Throttle } from '@nestjs/throttler';

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

  @Get('empresas/:empresaId/periodos-avaliacao/primeira')
  @ApiOperation({ summary: 'Buscar primeira data de referência da empresa' })
  async getPrimeiraData(
    @Param('empresaId') empresaId: string,
    @Request() req: { user: RequestUser },
  ) {
    const user = req.user;
    const primeiraData = await this.service.getPrimeiraDataReferencia(empresaId, user);
    return { primeiraData };
  }

  @Post('empresas/:empresaId/periodos-avaliacao/primeira-data')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @ApiOperation({ 
    summary: 'Criar primeira data de referência + primeiro período com snapshots',
    description: 'Usado apenas na primeira vez para empresas sem períodos. Cria período + snapshots imediatamente.',
  })
  async criarPrimeiraData(
    @Param('empresaId') empresaId: string,
    @Body() dto: PrimeiraDataDto,
    @Request() req: { user: RequestUser },
  ) {
    const user = req.user;
    const result = await this.service.criarPrimeiraData(empresaId, dto, user);
    return {
      message: 'Primeira data de referência criada com sucesso',
      periodo: result.periodo,
      snapshots: result.snapshots,
    };
  }

  @Post('empresas/:empresaId/periodos-avaliacao/congelar-auto')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @Throttle({ default: { limit: 1, ttl: 60000 } }) // 1 req/minuto (rate limiting)
  @ApiOperation({ 
    summary: 'Congelar/atualizar período automaticamente baseado em janela temporal',
    description: 'Cria novo período OU recongelamento ilimitado dentro da janela ativa (90 dias). Sistema calcula período automaticamente.',
  })
  async congelarAutomatico(
    @Param('empresaId') empresaId: string,
    @Request() req: { user: RequestUser },
  ) {
    const user = req.user;
    const result = await this.service.congelarAutomatico(empresaId, user);
    return {
      message: 'Período congelado/atualizado com sucesso',
      periodo: result.periodo,
      snapshots: result.snapshots,
    };
  }
}
