import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePeriodoAvaliacaoDto } from './dto/create-periodo-avaliacao.dto';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import {
  getQuarter,
  getYear,
  differenceInDays,
  format,
} from 'date-fns';

@Injectable()
export class PeriodosAvaliacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    empresaId: string,
    dto: CreatePeriodoAvaliacaoDto,
    user: RequestUser,
  ) {
    // 1. Validar multi-tenant
    if (
      user.perfil?.codigo !== 'ADMINISTRADOR' &&
      user.empresaId !== empresaId
    ) {
      throw new ForbiddenException(
        'Você não pode acessar dados de outra empresa',
      );
    }

    // 2. Calcular trimestre e ano baseado na data de referência
    const dataRef = new Date(dto.dataReferencia);
    const trimestre = getQuarter(dataRef);
    const ano = getYear(dataRef);

    // 3. Validar se já existe período aberto
    const periodoAberto = await this.prisma.periodoAvaliacao.findFirst({
      where: { empresaId, aberto: true },
    });

    if (periodoAberto) {
      throw new BadRequestException(
        `Já existe um período de avaliação aberto (Q${periodoAberto.trimestre}/${periodoAberto.ano})`,
      );
    }

    // 4. Validar intervalo de 90 dias
    const ultimoPeriodo = await this.prisma.periodoAvaliacao.findFirst({
      where: { empresaId },
      orderBy: { dataReferencia: 'desc' },
    });

    if (ultimoPeriodo) {
      const diffDays = differenceInDays(dataRef, ultimoPeriodo.dataReferencia);
      if (diffDays < 90) {
        throw new BadRequestException(
          `Intervalo mínimo de 90 dias não respeitado. Último período: ${format(
            ultimoPeriodo.dataReferencia,
            'dd/MM/yyyy',
          )}. Faltam ${90 - diffDays} dias.`,
        );
      }
    }

    // 5. Criar período
    const periodo = await this.prisma.periodoAvaliacao.create({
      data: {
        empresaId,
        trimestre,
        ano,
        dataReferencia: dataRef,
        aberto: true,
        createdBy: user.id,
      },
    });

    // 6. Auditar
    await this.auditService.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email || undefined,
      entidade: 'PeriodoAvaliacao',
      entidadeId: periodo.id,
      acao: 'CREATE',
      dadosDepois: { trimestre, ano, dataReferencia: dto.dataReferencia },
    });

    return periodo;
  }

  async congelar(periodoId: string, user: RequestUser) {
    // 1. Buscar período com empresa e pilares
    const periodo = await this.prisma.periodoAvaliacao.findUnique({
      where: { id: periodoId },
      include: {
        empresa: {
          include: {
            pilares: {
              where: { ativo: true },
              include: {
                rotinasEmpresa: {
                  where: { ativo: true },
                  include: {
                    notas: {
                      orderBy: { createdAt: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!periodo) {
      throw new NotFoundException('Período de avaliação não encontrado');
    }

    // 2. Validar multi-tenant
    if (
      user.perfil?.codigo !== 'ADMINISTRADOR' &&
      user.empresaId !== periodo.empresaId
    ) {
      throw new ForbiddenException(
        'Você não pode acessar dados de outra empresa',
      );
    }

    // 3. Validar se período está aberto
    if (!periodo.aberto) {
      throw new BadRequestException('Período já está congelado');
    }

    // 4. Transação atômica
    return this.prisma.$transaction(async (tx: any) => {
      // Criar ou atualizar snapshots de todos os pilares ativos
      const snapshots = await Promise.all(
        periodo.empresa.pilares.map((pilar: any) => {
          const media = this.calcularMediaPilar(pilar);

          return tx.pilarEvolucao.upsert({
            where: {
              pilarEmpresaId_periodoAvaliacaoId: {
                pilarEmpresaId: pilar.id,
                periodoAvaliacaoId: periodo.id,
              },
            },
            update: {
              mediaNotas: media,
              updatedBy: user.id,
            },
            create: {
              pilarEmpresaId: pilar.id,
              periodoAvaliacaoId: periodo.id,
              mediaNotas: media,
              createdBy: user.id,
            },
          });
        }),
      );

      // Fechar período
      const periodoAtualizado = await tx.periodoAvaliacao.update({
        where: { id: periodoId },
        data: {
          aberto: false,
          dataCongelamento: new Date(),
          updatedBy: user.id,
        },
        select: {
          id: true,
          empresaId: true,
          trimestre: true,
          ano: true,
          dataReferencia: true,
          aberto: true,
          dataCongelamento: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          updatedBy: true,
        },
      });

      // Auditar
      await this.auditService.log({
        usuarioId: user.id,
        usuarioNome: user.nome,
        usuarioEmail: user.email || undefined,
        entidade: 'PeriodoAvaliacao',
        entidadeId: periodoId,
        acao: 'UPDATE',
        dadosAntes: { aberto: true },
        dadosDepois: {
          aberto: false,
          dataCongelamento: periodoAtualizado.dataCongelamento,
          snapshotsCriados: snapshots.length,
        },
      });

      return { periodo: periodoAtualizado, snapshots };
    });
  }

  async findAtual(empresaId: string, user?: RequestUser) {
    // Validar multi-tenant (apenas se user estiver presente)
    if (
      user &&
      user.perfil?.codigo !== 'ADMINISTRADOR' &&
      user.empresaId !== empresaId
    ) {
      throw new ForbiddenException(
        'Você não pode acessar dados de outra empresa',
      );
    }

    return this.prisma.periodoAvaliacao.findFirst({
      where: { empresaId, aberto: true },
    });
  }

  async findAll(empresaId: string, ano?: number, user?: RequestUser) {
    // Validar multi-tenant
    if (
      user &&
      user.perfil?.codigo !== 'ADMINISTRADOR' &&
      user.empresaId !== empresaId
    ) {
      throw new ForbiddenException(
        'Você não pode acessar dados de outra empresa',
      );
    }

    return this.prisma.periodoAvaliacao.findMany({
      where: {
        empresaId,
        ano: ano || undefined,
        aberto: false, // Apenas períodos congelados
      },
      include: {
        snapshots: {
          include: {
            pilarEmpresa: {
              select: { id: true, nome: true },
            },
          },
        },
      },
      orderBy: [{ ano: 'asc' }, { trimestre: 'asc' }],
    });
  }

  private calcularMediaPilar(pilar: any): number {
    const rotinasComNota = pilar.rotinasEmpresa.filter(
      (rotina: any) => rotina.notas.length > 0 && rotina.notas[0].nota !== null,
    );

    if (rotinasComNota.length === 0) return 0;

    const somaNotas = rotinasComNota.reduce(
      (acc: number, rotina: any) => acc + rotina.notas[0].nota,
      0,
    );

    return somaNotas / rotinasComNota.length;
  }
}
