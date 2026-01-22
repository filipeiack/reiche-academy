import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePeriodoMentoriaDto } from './dto/create-periodo-mentoria.dto';
import { RenovarPeriodoMentoriaDto } from './dto/renovar-periodo-mentoria.dto';
import { addYears } from 'date-fns';

@Injectable()
export class PeriodosMentoriaService {
  constructor(private readonly prisma: PrismaService) {}

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
    const dataFim = addYears(dataInicio, 1);

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
    const dataFim = addYears(dataInicio, 1);
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
