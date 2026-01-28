import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePeriodoMentoriaDto } from './dto/create-periodo-mentoria.dto';
import { RenovarPeriodoMentoriaDto } from './dto/renovar-periodo-mentoria.dto';
import { addYears } from 'date-fns';

@Injectable()
export class PeriodosMentoriaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Calcula data fim corrigida para períodos anuais
   * Retorna 31 de dezembro do ano da dataInicio (meia-noite UTC)
   */
  private calcularDataFimAno(dataInicio: Date): Date {
    // Usar UTC para evitar timezone issues
    const ano = dataInicio.getUTCFullYear();
    // UTC: 31/dez/ano 23:59:59 UTC
    return new Date(Date.UTC(ano, 11, 31, 23, 59, 59, 999));
  }

  /**
   * Obtém ano de forma segura (UTC) para evitar timezone issues
   */
  private getAnoUTC(data: Date): number {
    return data.getUTCFullYear();
  }

  /**
   * R-MENT-001: Criar período com dataFim = dataInicio + 1 ano
   * R-MENT-002: Validar apenas 1 período ativo por empresa
   */
  async create(empresaId: string, dto: CreatePeriodoMentoriaDto, createdBy?: string) {
    // Verificar se empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa ${empresaId} não encontrada`);
    }

    // R-MENT-002: Validar período ativo único
    const periodoAtivo = await this.prisma.periodoMentoria.findFirst({
      where: {
        empresaId,
        ativo: true,
      },
    });

    if (periodoAtivo) {
      throw new ConflictException(
        `Empresa já possui período de mentoria ativo (Período ${periodoAtivo.numero})`,
      );
    }

    // Calcular número sequencial
    const ultimoPeriodo = await this.prisma.periodoMentoria.findFirst({
      where: { empresaId },
      orderBy: { numero: 'desc' },
    });

    const numero = ultimoPeriodo ? ultimoPeriodo.numero + 1 : 1;

    // R-MENT-001: Calcular dataFim (dataInicio + 1 ano)
    const dataInicio = new Date(dto.dataInicio);
    const dataFim = this.calcularDataFimAno(dataInicio);

    // Criar período
    const periodo = await this.prisma.periodoMentoria.create({
      data: {
        empresaId,
        numero,
        dataInicio,
        dataFim,
        ativo: true,
        createdBy,
      },
    });

    if (createdBy) {
      const user = await this.prisma.usuario.findUnique({ where: { id: createdBy } });
      await this.audit.log({
        usuarioId: createdBy,
        usuarioNome: user?.nome ?? '',
        usuarioEmail: user?.email ?? '',
        entidade: 'periodos_mentoria',
        entidadeId: periodo.id,
        acao: 'CREATE',
        dadosDepois: periodo,
      });
    }

    // Nota: Criação de meses dos indicadores agora é responsabilidade do Cockpit
    // (botão "Criar Cockpit" ou "Novo ciclo de 12 meses")

    return periodo;
  }

  /**
   * Listar todos os períodos de uma empresa (histórico completo)
   */
  async findByEmpresa(empresaId: string) {
    return this.prisma.periodoMentoria.findMany({
      where: { empresaId },
      orderBy: { numero: 'desc' },
    });
  }

  /**
   * Buscar período ativo de uma empresa
   */
  async findAtivo(empresaId: string) {
    return this.prisma.periodoMentoria.findFirst({
      where: {
        empresaId,
        ativo: true,
      },
    });
  }

  /**
   * R-MENT-003: Renovação encerra período anterior
   */
  async renovar(
    empresaId: string,
    periodoId: string,
    dto: RenovarPeriodoMentoriaDto,
    updatedBy?: string,
  ) {
    // Verificar se período existe e pertence à empresa
    const periodoAtual = await this.prisma.periodoMentoria.findFirst({
      where: {
        id: periodoId,
        empresaId,
      },
    });

    if (!periodoAtual) {
      throw new NotFoundException('Período de mentoria não encontrado');
    }

    // Validar que é o período ativo
    if (!periodoAtual.ativo) {
      throw new BadRequestException('Não é possível renovar período já encerrado');
    }

    // Validar data de início (deve ser após período atual)
    const dataInicio = new Date(dto.dataInicio);
    if (dataInicio < periodoAtual.dataFim) {
      throw new BadRequestException(
        `Data de início da renovação deve ser posterior a ${periodoAtual.dataFim.toISOString().split('T')[0]}`,
      );
    }

    // R-MENT-003: Encerrar período atual e criar novo
    const dataFim = this.calcularDataFimAno(dataInicio);
    const novoNumero = periodoAtual.numero + 1;

    const [periodoEncerrado, novoPeriodo] = await this.prisma.$transaction([
      // Encerrar período atual
      this.prisma.periodoMentoria.update({
        where: { id: periodoId },
        data: {
          ativo: false,
          dataEncerramento: new Date(),
          updatedBy,
        },
      }),
      // Criar novo período
      this.prisma.periodoMentoria.create({
        data: {
          empresaId,
          numero: novoNumero,
          dataInicio,
          dataFim,
          ativo: true,
          createdBy: updatedBy,
        },
      }),
    ]);

    if (updatedBy) {
      const user = await this.prisma.usuario.findUnique({ where: { id: updatedBy } });
      await this.audit.log({
        usuarioId: updatedBy,
        usuarioNome: user?.nome ?? '',
        usuarioEmail: user?.email ?? '',
        entidade: 'periodos_mentoria',
        entidadeId: periodoId,
        acao: 'UPDATE',
        dadosAntes: periodoAtual,
        dadosDepois: periodoEncerrado,
      });

      await this.audit.log({
        usuarioId: updatedBy,
        usuarioNome: user?.nome ?? '',
        usuarioEmail: user?.email ?? '',
        entidade: 'periodos_mentoria',
        entidadeId: novoPeriodo.id,
        acao: 'CREATE',
        dadosDepois: novoPeriodo,
      });
    }

    // Nota: Criação de novos meses dos indicadores agora é responsabilidade do Cockpit
    // (botão "Novo ciclo de 12 meses" na tela de edição de valores mensais)

    return novoPeriodo;
  }

  /**
   * Buscar período por ID (auxiliar)
   */
  async findOne(id: string) {
    const periodo = await this.prisma.periodoMentoria.findUnique({
      where: { id },
    });

    if (!periodo) {
      throw new NotFoundException('Período de mentoria não encontrado');
    }

    return periodo;
  }
}
