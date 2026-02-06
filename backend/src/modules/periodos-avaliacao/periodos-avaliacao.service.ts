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
import { getQuarter, getYear, differenceInDays } from 'date-fns';
import { formatDateInSaoPaulo, nowInSaoPaulo, parseDateInSaoPaulo } from '../../common/utils/timezone';
import { PrimeiraDataDto } from './dto/primeira-data.dto';
import { addDays } from 'date-fns';

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
    const dataRef = parseDateInSaoPaulo(dto.dataReferencia);
    const trimestre = getQuarter(dataRef);
    const ano = getYear(dataRef);

    // 3. R-PEVOL-003: Buscar período de mentoria ativo e validar dataReferencia
    const periodoMentoria = await this.prisma.periodoMentoria.findFirst({
      where: {
        empresaId,
        ativo: true,
      },
    });

    if (!periodoMentoria) {
      throw new BadRequestException(
        'Empresa não possui período de mentoria ativo. Configure um período de mentoria antes de criar período de avaliação.',
      );
    }

    // Validar que dataReferencia está dentro do período de mentoria
    if (dataRef < periodoMentoria.dataInicio || dataRef > periodoMentoria.dataFim) {
      throw new BadRequestException(
        `Data de referência deve estar dentro do período de mentoria ativo (${formatDateInSaoPaulo(periodoMentoria.dataInicio, 'dd/MM/yyyy')} - ${formatDateInSaoPaulo(periodoMentoria.dataFim, 'dd/MM/yyyy')})`,
      );
    }

    // 4. Validar se já existe período aberto
    const periodoAberto = await this.prisma.periodoAvaliacao.findFirst({
      where: { empresaId, aberto: true },
    });

    if (periodoAberto) {
      throw new BadRequestException(
        `Já existe um período de avaliação aberto (Q${periodoAberto.trimestre}/${periodoAberto.ano})`,
      );
    }

    // 5. Validar intervalo de 90 dias
    const ultimoPeriodo = await this.prisma.periodoAvaliacao.findFirst({
      where: { empresaId },
      orderBy: { dataReferencia: 'desc' },
    });

    if (ultimoPeriodo) {
      const diffDays = differenceInDays(dataRef, ultimoPeriodo.dataReferencia);
      if (diffDays < 90) {
        throw new BadRequestException(
          `Intervalo mínimo de 90 dias não respeitado. Último período: ${formatDateInSaoPaulo(
            ultimoPeriodo.dataReferencia,
            'dd/MM/yyyy',
          )}. Faltam ${90 - diffDays} dias.`,
        );
      }
    }

    // 6. Criar período vinculado ao período de mentoria
    const periodo = await this.prisma.periodoAvaliacao.create({
      data: {
        empresaId,
        periodoMentoriaId: periodoMentoria.id,
        trimestre,
        ano,
        dataReferencia: dataRef,
        aberto: true,
        createdBy: user.id,
      },
    });

    // 7. Auditar
    await this.auditService.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email || undefined,
      entidade: 'PeriodoAvaliacao',
      entidadeId: periodo.id,
      acao: 'CREATE',
      dadosDepois: { trimestre, ano, dataReferencia: dto.dataReferencia, periodoMentoriaId: periodoMentoria.id },
    });

    return periodo;
  }

  /**
   * Buscar primeira data de referência da empresa (MIN(dataReferencia))
   */
  async getPrimeiraDataReferencia(
    empresaId: string,
    user?: RequestUser,
  ): Promise<Date | null> {
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

    const primeiroPeriodo = await this.prisma.periodoAvaliacao.findFirst({
      where: { empresaId },
      orderBy: { dataReferencia: 'asc' },
      select: { dataReferencia: true },
    });

    return primeiroPeriodo?.dataReferencia || null;
  }

  /**
   * Calcular período ativo baseado em janela temporal
   */
  private calcularPeriodoAtivo(
    hoje: Date,
    primeiraData: Date,
  ): {
    numeroPeriodo: number;
    dataReferencia: Date;
    janelaInicio: Date;
    janelaFim: Date;
    trimestre: number;
    ano: number;
  } {
    const diasDesdePrimeiro = differenceInDays(hoje, primeiraData);
    const numeroPeriodo = Math.floor(diasDesdePrimeiro / 90) + 1;

    const dataReferencia = addDays(primeiraData, 90 * (numeroPeriodo - 1));
    const janelaInicio = dataReferencia;
    const janelaFim = addDays(dataReferencia, 89); // 90 dias - 1

    const trimestre = getQuarter(dataReferencia);
    const ano = getYear(dataReferencia);

    return {
      numeroPeriodo,
      dataReferencia,
      janelaInicio,
      janelaFim,
      trimestre,
      ano,
    };
  }

  /**
   * Criar primeira data de referência + primeiro período com snapshots
   */
  async criarPrimeiraData(
    empresaId: string,
    dto: PrimeiraDataDto,
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

    // 2. Validar que empresa não tem nenhum período
    const periodoExistente = await this.prisma.periodoAvaliacao.findFirst({
      where: { empresaId },
    });

    if (periodoExistente) {
      throw new BadRequestException(
        'Empresa já possui períodos de avaliação. Não é possível redefinir primeira data.',
      );
    }

    // 3. Validar data de referência
    const dataRef = parseDateInSaoPaulo(dto.dataReferencia);
    const hoje = nowInSaoPaulo();

    // 3a. Buscar período de mentoria ativo
    const periodoMentoria = await this.prisma.periodoMentoria.findFirst({
      where: {
        empresaId,
        ativo: true,
      },
    });

    if (!periodoMentoria) {
      throw new BadRequestException(
        'Empresa não possui período de mentoria ativo.',
      );
    }

    // 3b. Validar que dataRef está dentro do período de mentoria
    if (dataRef < periodoMentoria.dataInicio || dataRef > periodoMentoria.dataFim) {
      throw new BadRequestException(
        `Data de referência deve estar dentro do período de mentoria (${formatDateInSaoPaulo(periodoMentoria.dataInicio, 'dd/MM/yyyy')} - ${formatDateInSaoPaulo(periodoMentoria.dataFim, 'dd/MM/yyyy')})`,
      );
    }

    // 4. Calcular trimestre e ano
    const trimestre = getQuarter(dataRef);
    const ano = getYear(dataRef);

    // 5. Buscar pilares ativos com médias
    const pilares = await this.prisma.pilarEmpresa.findMany({
      where: { empresaId, ativo: true },
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
    });

    // 6. Filtrar pilares com notas (GAP B - pular apenas pilares sem notas)
    const pilaresComNotas = pilares.filter((pilar) =>
      this.pilarTemNotas(pilar),
    );

    if (pilaresComNotas.length === 0) {
      throw new BadRequestException(
        'Nenhuma nota foi lançada. Crie o primeiro período após lançar pelo menos 1 nota.',
      );
    }

    // 7. Transação atômica: criar período + snapshots imediatamente (GAP A - opção 1)
    return this.prisma.$transaction(async (tx: any) => {
      // Criar período
      const periodo = await tx.periodoAvaliacao.create({
        data: {
          empresaId,
          periodoMentoriaId: periodoMentoria.id,
          trimestre,
          ano,
          dataReferencia: dataRef,
          aberto: true,
          dataCongelamento: nowInSaoPaulo(),
          createdBy: user.id,
        },
      });

      // Criar snapshots apenas de pilares com notas
      const snapshots = await Promise.all(
        pilaresComNotas.map((pilar: any) => {
          const media = this.calcularMediaPilar(pilar);

          return tx.pilarEvolucao.create({
            data: {
              pilarEmpresaId: pilar.id,
              periodoAvaliacaoId: periodo.id,
              mediaNotas: media,
              createdBy: user.id,
            },
          });
        }),
      );

      // Auditar
      await this.auditService.log({
        usuarioId: user.id,
        usuarioNome: user.nome,
        usuarioEmail: user.email || undefined,
        entidade: 'PeriodoAvaliacao',
        entidadeId: periodo.id,
        acao: 'CREATE',
        dadosDepois: {
          trimestre,
          ano,
          dataReferencia: dto.dataReferencia,
          primeiraData: true,
          snapshotsCriados: snapshots.length,
        },
      });

      return { periodo, snapshots };
    });
  }

  /**
   * Congelar automaticamente período baseado em janela temporal
   */
  async congelarAutomatico(empresaId: string, user: RequestUser) {
    // 1. Validar multi-tenant
    if (
      user.perfil?.codigo !== 'ADMINISTRADOR' &&
      user.empresaId !== empresaId
    ) {
      throw new ForbiddenException(
        'Você não pode acessar dados de outra empresa',
      );
    }

    // 2. Buscar primeira data de referência
    const primeiraData = await this.getPrimeiraDataReferencia(empresaId);

    if (!primeiraData) {
      throw new BadRequestException(
        'Empresa não possui primeira data de referência. Use o endpoint /primeira-data primeiro.',
      );
    }

    // 3. Calcular período ativo baseado em janela temporal
    const hoje = nowInSaoPaulo();
    const periodoAtivo = this.calcularPeriodoAtivo(hoje, primeiraData);

    // 4. Validar janela temporal estrita (não permite congelar período passado)
    if (hoje < periodoAtivo.janelaInicio || hoje > periodoAtivo.janelaFim) {
      const proximoPeriodo = this.calcularPeriodoAtivo(
        addDays(periodoAtivo.janelaFim, 1),
        primeiraData,
      );

      throw new BadRequestException(
        `Fora da janela temporal permitida. ` +
        `Período atual (${formatDateInSaoPaulo(periodoAtivo.dataReferencia, 'MM/yyyy')}) encerrou em ${formatDateInSaoPaulo(periodoAtivo.janelaFim, 'dd/MM/yyyy')}. ` +
        `Próximo período (${formatDateInSaoPaulo(proximoPeriodo.dataReferencia, 'MM/yyyy')}) estará disponível a partir de ${formatDateInSaoPaulo(proximoPeriodo.janelaInicio, 'dd/MM/yyyy')}.`,
      );
    }

    // 5. Buscar período existente com esta data de referência
    const periodoExistente = await this.prisma.periodoAvaliacao.findFirst({
      where: {
        empresaId,
        dataReferencia: periodoAtivo.dataReferencia,
      },
      include: {
        snapshots: true,
      },
    });

    // 6a. Se período existe para a janela ativa: recongelar (atualizar snapshots)
    // Permite recongelar mesmo se aberto=false em dados legados
    if (periodoExistente) {
      return this.recongelarPeriodoAberto(periodoExistente.id, empresaId, user);
    }

    // 7. Período não existe: criar novo período
    return this.criarNovoPeriodoAutomatico(
      empresaId,
      periodoAtivo,
      user,
    );
  }

  /**
   * Recongelar período aberto (atualizar snapshots, mantém aberto: true)
   */
  private async recongelarPeriodoAberto(
    periodoId: string,
    empresaId: string,
    user: RequestUser,
  ) {
    // 1. Buscar pilares ativos
    const pilares = await this.prisma.pilarEmpresa.findMany({
      where: { empresaId, ativo: true },
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
    });

    // 2. Filtrar pilares com notas
    const pilaresComNotas = pilares.filter((pilar) =>
      this.pilarTemNotas(pilar),
    );

    if (pilaresComNotas.length === 0) {
      throw new BadRequestException(
        'Nenhuma nota lançada. Não é possível atualizar período sem médias.',
      );
    }

    // 3. Transação: deletar snapshots antigos + criar novos
    return this.prisma.$transaction(async (tx: any) => {
      // Buscar snapshots antigos para auditoria
      const snapshotsAntigos = await tx.pilarEvolucao.findMany({
        where: { periodoAvaliacaoId: periodoId },
      });

      // Deletar snapshots existentes
      await tx.pilarEvolucao.deleteMany({
        where: { periodoAvaliacaoId: periodoId },
      });

      // Criar novos snapshots
      const snapshotsNovos = await Promise.all(
        pilaresComNotas.map((pilar: any) => {
          const media = this.calcularMediaPilar(pilar);

          return tx.pilarEvolucao.create({
            data: {
              pilarEmpresaId: pilar.id,
              periodoAvaliacaoId: periodoId,
              mediaNotas: media,
              createdBy: user.id,
            },
          });
        }),
      );

      // Atualizar dataCongelamento e reabrir período se necessário
      const periodoAtualizado = await tx.periodoAvaliacao.update({
        where: { id: periodoId },
        data: {
          dataCongelamento: nowInSaoPaulo(),
          aberto: true,
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
        dadosDepois: {
          operacao: 'RECONGELAMENTO_JANELA_ATIVA',
          snapshotsSubstituidos: snapshotsAntigos.length,
          snapshotsNovos: snapshotsNovos.length,
        },
      });

      return { periodo: periodoAtualizado, snapshots: snapshotsNovos };
    });
  }

  /**
   * Criar novo período automaticamente baseado em janela temporal
   */
  private async criarNovoPeriodoAutomatico(
    empresaId: string,
    periodoAtivo: {
      numeroPeriodo: number;
      dataReferencia: Date;
      janelaInicio: Date;
      janelaFim: Date;
      trimestre: number;
      ano: number;
    },
    user: RequestUser,
  ) {
    // 1. Buscar período de mentoria ativo
    const periodoMentoria = await this.prisma.periodoMentoria.findFirst({
      where: {
        empresaId,
        ativo: true,
      },
    });

    if (!periodoMentoria) {
      throw new BadRequestException(
        'Empresa não possui período de mentoria ativo.',
      );
    }

    // 2. Buscar pilares ativos
    const pilares = await this.prisma.pilarEmpresa.findMany({
      where: { empresaId, ativo: true },
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
    });

    // 3. Filtrar pilares com notas
    const pilaresComNotas = pilares.filter((pilar) =>
      this.pilarTemNotas(pilar),
    );

    if (pilaresComNotas.length === 0) {
      throw new BadRequestException(
        'Nenhuma nota lançada. Não é possível criar período sem médias.',
      );
    }

    // 4. Verificar período existente para o mesmo trimestre/ano (legado)
    const periodoExistenteTrimestre = await this.prisma.periodoAvaliacao.findUnique({
      where: {
        empresaId_trimestre_ano: {
          empresaId,
          trimestre: periodoAtivo.trimestre,
          ano: periodoAtivo.ano,
        },
      },
      select: { id: true },
    });

    // 5. Transação: criar/atualizar período + snapshots
    return this.prisma.$transaction(async (tx: any) => {
      const periodo = await tx.periodoAvaliacao.upsert({
        where: {
          empresaId_trimestre_ano: {
            empresaId,
            trimestre: periodoAtivo.trimestre,
            ano: periodoAtivo.ano,
          },
        },
        update: {
          dataReferencia: periodoAtivo.dataReferencia,
          aberto: true,
          dataCongelamento: nowInSaoPaulo(),
          updatedBy: user.id,
        },
        create: {
          empresaId,
          periodoMentoriaId: periodoMentoria.id,
          trimestre: periodoAtivo.trimestre,
          ano: periodoAtivo.ano,
          dataReferencia: periodoAtivo.dataReferencia,
          aberto: true,
          dataCongelamento: nowInSaoPaulo(),
          createdBy: user.id,
        },
      });

      // Se período já existia, limpar snapshots antigos antes de criar novos
      if (periodoExistenteTrimestre) {
        await tx.pilarEvolucao.deleteMany({
          where: { periodoAvaliacaoId: periodo.id },
        });
      }

      // Criar snapshots
      const snapshots = await Promise.all(
        pilaresComNotas.map((pilar: any) => {
          const media = this.calcularMediaPilar(pilar);

          return tx.pilarEvolucao.create({
            data: {
              pilarEmpresaId: pilar.id,
              periodoAvaliacaoId: periodo.id,
              mediaNotas: media,
              createdBy: user.id,
            },
          });
        }),
      );

      // Auditar
      await this.auditService.log({
        usuarioId: user.id,
        usuarioNome: user.nome,
        usuarioEmail: user.email || undefined,
        entidade: 'PeriodoAvaliacao',
        entidadeId: periodo.id,
        acao: periodoExistenteTrimestre ? 'UPDATE' : 'CREATE',
        dadosDepois: {
          trimestre: periodoAtivo.trimestre,
          ano: periodoAtivo.ano,
          dataReferencia: periodoAtivo.dataReferencia,
          snapshotsCriados: snapshots.length,
          criadoAutomaticamente: true,
          reutilizadoTrimestreAno: Boolean(periodoExistenteTrimestre),
        },
      });

      return { periodo, snapshots };
    });
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

  async recongelar(periodoId: string, user: RequestUser) {
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

    // 2. Validar se período está congelado
    if (periodo.aberto) {
      throw new BadRequestException(
        'Período está aberto - use congelar() ao invés de recongelar()',
      );
    }

    // 3. Validar multi-tenant
    if (
      user.perfil?.codigo !== 'ADMINISTRADOR' &&
      user.empresaId !== periodo.empresaId
    ) {
      throw new ForbiddenException(
        'Você não pode acessar dados de outra empresa',
      );
    }

    // 4. Validar permissões RBAC
    const perfisAutorizados = ['ADMINISTRADOR', 'CONSULTOR', 'GESTOR'];
    if (!perfisAutorizados.includes(user.perfil?.codigo)) {
      throw new ForbiddenException(
        'Perfil não autorizado para recongelar períodos',
      );
    }

    // 5. Transação atômica
    return this.prisma.$transaction(async (tx: any) => {
      // Coletar snapshots antigos para auditoria
      const snapshotsAntigos = await tx.pilarEvolucao.findMany({
        where: { periodoAvaliacaoId: periodoId },
        include: {
          pilarEmpresa: {
            select: { id: true, nome: true },
          },
        },
      });

      // Deletar snapshots existentes
      await tx.pilarEvolucao.deleteMany({
        where: { periodoAvaliacaoId: periodoId },
      });

      // Criar novos snapshots com médias atuais
      const snapshotsNovos = await Promise.all(
        periodo.empresa.pilares.map((pilar: any) => {
          const media = this.calcularMediaPilar(pilar);

          return tx.pilarEvolucao.create({
            data: {
              pilarEmpresaId: pilar.id,
              periodoAvaliacaoId: periodo.id,
              mediaNotas: media,
              createdBy: user.id,
            },
          });
        }),
      );

      // Atualizar timestamp do período (mantém aberto: false)
      const periodoAtualizado = await tx.periodoAvaliacao.update({
        where: { id: periodoId },
        data: {
          updatedAt: nowInSaoPaulo(),
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
          updatedBy: true,
        },
      });

      // Auditar operação completa
      await this.auditService.log({
        usuarioId: user.id,
        usuarioNome: user.nome,
        usuarioEmail: user.email || undefined,
        entidade: 'PeriodoAvaliacao',
        entidadeId: periodoId,
        acao: 'UPDATE',
        dadosAntes: {
          snapshots: snapshotsAntigos.map((s: any) => ({
            pilarNome: s.pilarEmpresa.nome,
            mediaAntiga: s.mediaNotas,
          })),
        },
        dadosDepois: {
          snapshotsCriados: snapshotsNovos.length,
          snapshotsSubstituidos: snapshotsAntigos.length,
          operacao: 'RECONGELAMENTO',
        },
      });

      return {
        periodo: periodoAtualizado,
        snapshotsNovos,
        snapshotsAntigos,
      };
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

  private pilarTemNotas(pilar: any): boolean {
    return pilar.rotinasEmpresa.some(
      (rotina: any) => rotina.notas.length > 0 && rotina.notas[0].nota !== null,
    );
  }
}
