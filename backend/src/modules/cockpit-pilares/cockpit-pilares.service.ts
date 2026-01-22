import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';
import { CreateCockpitPilarDto } from './dto/create-cockpit-pilar.dto';
import { UpdateCockpitPilarDto } from './dto/update-cockpit-pilar.dto';
import { CreateIndicadorCockpitDto } from './dto/create-indicador-cockpit.dto';
import { UpdateIndicadorCockpitDto } from './dto/update-indicador-cockpit.dto';
import { UpdateValoresMensaisDto } from './dto/update-valores-mensais.dto';
import { UpdateProcessoPrioritarioDto } from './dto/update-processo-prioritario.dto';

@Injectable()
export class CockpitPilaresService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Valida acesso multi-tenant
   * ADMINISTRADOR tem acesso global
   * Outros perfis só podem acessar sua própria empresa
   */
  private validateTenantAccess(empresaId: string, user: RequestUser) {
    if (user.perfil?.codigo === 'ADMINISTRADOR') {
      return;
    }

    if (user.empresaId !== empresaId) {
      throw new ForbiddenException(
        'Você não pode acessar dados de outra empresa',
      );
    }
  }

  /**
   * Valida se o cockpit pertence à empresa do usuário
   */
  private async validateCockpitAccess(cockpitId: string, user: RequestUser) {
    const cockpit = await this.prisma.cockpitPilar.findUnique({
      where: { id: cockpitId },
      include: {
        pilarEmpresa: {
          include: {
            empresa: true,
          },
        },
      },
    });

    if (!cockpit) {
      throw new NotFoundException('Cockpit não encontrado');
    }

    if (user.perfil?.codigo !== 'ADMINISTRADOR') {
      if (cockpit.pilarEmpresa.empresa.id !== user.empresaId) {
        throw new ForbiddenException(
          'Você não pode acessar cockpits de outra empresa',
        );
      }
    }

    return cockpit;
  }

  /**
   * Criar cockpit para um pilar
   * Auto-vincula rotinas ativas do pilar como processos prioritários
   */
  async createCockpit(dto: CreateCockpitPilarDto, user: RequestUser) {
    // Validar que pilar existe e pertence à empresa do usuário
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: dto.pilarEmpresaId },
      include: {
        empresa: true,
        cockpit: true,
      },
    });

    if (!pilarEmpresa) {
      throw new NotFoundException('Pilar não encontrado');
    }

    this.validateTenantAccess(pilarEmpresa.empresaId, user);

    // Verificar se já existe cockpit para este pilar
    if (pilarEmpresa.cockpit) {
      throw new ConflictException('Este pilar já possui um cockpit');
    }

    // Criar cockpit
    const cockpit = await this.prisma.cockpitPilar.create({
      data: {
        pilarEmpresaId: dto.pilarEmpresaId,
        entradas: dto.entradas,
        saidas: dto.saidas,
        missao: dto.missao,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    // Auto-vincular rotinas ativas do pilar como processos prioritários
    const rotinas = await this.prisma.rotinaEmpresa.findMany({
      where: {
        pilarEmpresaId: dto.pilarEmpresaId,
        ativo: true,
      },
      orderBy: { ordem: 'asc' },
    });

    if (rotinas.length > 0) {
      const processos = rotinas.map((rotina, index) => ({
        cockpitPilarId: cockpit.id,
        rotinaEmpresaId: rotina.id,
        ordem: index + 1,
        createdBy: user.id,
        updatedBy: user.id,
      }));

      await this.prisma.processoPrioritario.createMany({
        data: processos,
      });
    }

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'CockpitPilar',
      entidadeId: cockpit.id,
      acao: 'CREATE',
      dadosDepois: { cockpitId: cockpit.id, pilarNome: pilarEmpresa.nome, processosVinculados: rotinas.length },
    });

    // Retornar cockpit com relações
    return this.prisma.cockpitPilar.findUnique({
      where: { id: cockpit.id },
      include: {
        pilarEmpresa: {
          include: {
            pilarTemplate: true,
          },
        },
        indicadores: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
          include: {
            responsavelMedicao: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        processosPrioritarios: {
          orderBy: { ordem: 'asc' },
          include: {
            rotinaEmpresa: true,
          },
        },
      },
    });
  }

  /**
   * Listar cockpits de uma empresa
   */
  async getCockpitsByEmpresa(empresaId: string, user: RequestUser) {
    this.validateTenantAccess(empresaId, user);

    return this.prisma.cockpitPilar.findMany({
      where: {
        ativo: true,
        pilarEmpresa: {
          empresaId,
          ativo: true,
        },
      },
      include: {
        pilarEmpresa: {
          include: {
            pilarTemplate: true,
          },
        },
        _count: {
          select: {
            indicadores: {
              where: { ativo: true },
            },
            processosPrioritarios: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Buscar cockpit por ID com todas as relações
   */
  async getCockpitById(cockpitId: string, user: RequestUser) {
    await this.validateCockpitAccess(cockpitId, user);

    return this.prisma.cockpitPilar.findUnique({
      where: { id: cockpitId },
      include: {
        pilarEmpresa: {
          include: {
            pilarTemplate: true,
            empresa: true,
          },
        },
        indicadores: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
          include: {
            responsavelMedicao: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            mesesIndicador: {
              orderBy: [{ ano: 'desc' }, { mes: 'asc' }],
            },
          },
        },
        processosPrioritarios: {
          orderBy: { ordem: 'asc' },
          include: {
            rotinaEmpresa: true,
          },
        },
      },
    });
  }

  /**
   * Atualizar contexto do cockpit (entradas, saídas, missão)
   */
  async updateCockpit(
    cockpitId: string,
    dto: UpdateCockpitPilarDto,
    user: RequestUser,
  ) {
    await this.validateCockpitAccess(cockpitId, user);

    const updated = await this.prisma.cockpitPilar.update({
      where: { id: cockpitId },
      data: {
        ...dto,
        updatedBy: user.id,
      },
      include: {
        pilarEmpresa: true,
      },
    });

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'CockpitPilar',
      entidadeId: cockpitId,
      acao: 'UPDATE',
      dadosDepois: dto,
    });

    return updated;
  }

  /**
   * Soft delete de cockpit
   */
  async deleteCockpit(cockpitId: string, user: RequestUser) {
    const cockpit = await this.validateCockpitAccess(cockpitId, user);

    await this.prisma.cockpitPilar.update({
      where: { id: cockpitId },
      data: {
        ativo: false,
        updatedBy: user.id,
      },
    });

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'CockpitPilar',
      entidadeId: cockpitId,
      acao: 'DELETE',
      dadosDepois: { pilarNome: cockpit.pilarEmpresa.nome },
    });

    return { message: 'Cockpit desativado com sucesso' };
  }

  // ==================== INDICADORES ====================

  /**
   * Criar indicador com auto-criação de 13 meses (jan-dez + anual)
   */
  async createIndicador(
    cockpitId: string,
    dto: CreateIndicadorCockpitDto,
    user: RequestUser,
  ) {
    const cockpit = await this.validateCockpitAccess(cockpitId, user);

    // Validar nome único por cockpit
    const existing = await this.prisma.indicadorCockpit.findFirst({
      where: {
        cockpitPilarId: cockpitId,
        nome: dto.nome,
        ativo: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe um indicador com este nome neste cockpit',
      );
    }

    // Validar responsável pertence à mesma empresa
    if (dto.responsavelMedicaoId) {
      const responsavel = await this.prisma.usuario.findUnique({
        where: { id: dto.responsavelMedicaoId },
      });

      if (!responsavel) {
        throw new NotFoundException('Responsável não encontrado');
      }

      if (
        user.perfil?.codigo !== 'ADMINISTRADOR' &&
        responsavel.empresaId !== cockpit.pilarEmpresa.empresa.id
      ) {
        throw new ForbiddenException(
          'Responsável deve ser da mesma empresa do cockpit',
        );
      }
    }

    // Calcular ordem
    const maxOrdem = await this.prisma.indicadorCockpit.findFirst({
      where: {
        cockpitPilarId: cockpitId,
        ativo: true,
      },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });

    const ordem = dto.ordem ?? (maxOrdem ? maxOrdem.ordem + 1 : 1);

    // Criar indicador
    const indicador = await this.prisma.indicadorCockpit.create({
      data: {
        cockpitPilarId: cockpitId,
        nome: dto.nome,
        descricao: dto.descricao,
        tipoMedida: dto.tipoMedida,
        statusMedicao: dto.statusMedicao,
        responsavelMedicaoId: dto.responsavelMedicaoId,
        melhor: dto.melhor,
        ordem,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    // Auto-criar 13 meses (jan-dez + anual)
    const anoAtual = new Date().getFullYear();
    const meses = [
      ...Array.from({ length: 12 }, (_, i) => ({
        indicadorCockpitId: indicador.id,
        mes: i + 1,
        ano: anoAtual,
        createdBy: user.id,
        updatedBy: user.id,
      })),
      {
        indicadorCockpitId: indicador.id,
        mes: null, // Resumo anual
        ano: anoAtual,
        createdBy: user.id,
        updatedBy: user.id,
      },
    ];

    await this.prisma.indicadorMensal.createMany({
      data: meses,
    });

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'IndicadorCockpit',
      entidadeId: indicador.id,
      acao: 'CREATE',
      dadosDepois: { nome: dto.nome, cockpitId: cockpitId },
    });

    // Retornar indicador com meses
    return this.prisma.indicadorCockpit.findUnique({
      where: { id: indicador.id },
      include: {
        responsavelMedicao: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        mesesIndicador: {
          orderBy: [{ ano: 'desc' }, { mes: 'asc' }],
        },
      },
    });
  }

  /**
   * Atualizar propriedades do indicador
   */
  async updateIndicador(
    indicadorId: string,
    dto: UpdateIndicadorCockpitDto,
    user: RequestUser,
  ) {
    const indicador = await this.prisma.indicadorCockpit.findUnique({
      where: { id: indicadorId },
      include: {
        cockpitPilar: {
          include: {
            pilarEmpresa: {
              include: {
                empresa: true,
              },
            },
          },
        },
      },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador não encontrado');
    }

    await this.validateCockpitAccess(indicador.cockpitPilarId, user);

    // Validar nome único por cockpit (se alterando)
    if (dto.nome && dto.nome !== indicador.nome) {
      const existing = await this.prisma.indicadorCockpit.findFirst({
        where: {
          cockpitPilarId: indicador.cockpitPilarId,
          nome: dto.nome,
          ativo: true,
          id: { not: indicadorId },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Já existe um indicador com este nome neste cockpit',
        );
      }
    }

    // Validar responsável pertence à mesma empresa (se alterando)
    if (dto.responsavelMedicaoId) {
      const responsavel = await this.prisma.usuario.findUnique({
        where: { id: dto.responsavelMedicaoId },
      });

      if (!responsavel) {
        throw new NotFoundException('Responsável não encontrado');
      }

      if (
        user.perfil?.codigo !== 'ADMINISTRADOR' &&
        responsavel.empresaId !==
          indicador.cockpitPilar.pilarEmpresa.empresa.id
      ) {
        throw new ForbiddenException(
          'Responsável deve ser da mesma empresa do cockpit',
        );
      }
    }

    const updated = await this.prisma.indicadorCockpit.update({
      where: { id: indicadorId },
      data: {
        ...dto,
        updatedBy: user.id,
      },
    });

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'IndicadorCockpit',
      entidadeId: indicadorId,
      acao: 'UPDATE',
      dadosDepois: dto,
    });

    return updated;
  }

  /**
   * Soft delete de indicador
   */
  async deleteIndicador(indicadorId: string, user: RequestUser) {
    const indicador = await this.prisma.indicadorCockpit.findUnique({
      where: { id: indicadorId },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador não encontrado');
    }

    await this.validateCockpitAccess(indicador.cockpitPilarId, user);

    await this.prisma.indicadorCockpit.update({
      where: { id: indicadorId },
      data: {
        ativo: false,
        updatedBy: user.id,
      },
    });

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'IndicadorCockpit',
      entidadeId: indicadorId,
      acao: 'DELETE',
      dadosDepois: { nome: indicador.nome },
    });

    return { message: 'Indicador desativado com sucesso' };
  }

  /**
   * Batch update de valores mensais (meta/realizado)
   */
  async updateValoresMensais(
    indicadorId: string,
    dto: UpdateValoresMensaisDto,
    user: RequestUser,
  ) {
    const indicador = await this.prisma.indicadorCockpit.findUnique({
      where: { id: indicadorId },
      include: {
        cockpitPilar: {
          include: {
            pilarEmpresa: true,
          },
        },
      },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador não encontrado');
    }

    await this.validateCockpitAccess(indicador.cockpitPilarId, user);

    // R-MENT-008: Buscar período de mentoria ativo para validação
    const periodoMentoria = await this.prisma.periodoMentoria.findFirst({
      where: {
        empresaId: indicador.cockpitPilar.pilarEmpresa.empresaId,
        ativo: true,
      },
    });

    if (!periodoMentoria) {
      throw new BadRequestException(
        'Empresa não possui período de mentoria ativo',
      );
    }

    // Atualizar cada valor mensal
    const updates = dto.valores.map(async (valor) => {
      // R-MENT-008: Validar que mes/ano está dentro do período (exceto histórico)
      if (valor.historico === undefined || valor.historico === null) {
        // Validar apenas meta e realizado
        const dataValor = new Date(valor.ano, (valor.mes ?? 1) - 1, 1);
        const dataInicioPeriodo = new Date(
          periodoMentoria.dataInicio.getFullYear(),
          periodoMentoria.dataInicio.getMonth(),
          1,
        );
        const dataFimPeriodo = new Date(
          periodoMentoria.dataFim.getFullYear(),
          periodoMentoria.dataFim.getMonth(),
          1,
        );

        if (valor.mes && (dataValor < dataInicioPeriodo || dataValor > dataFimPeriodo)) {
          throw new BadRequestException(
            `Mês ${valor.mes}/${valor.ano} está fora do período de mentoria ativo`,
          );
        }
      }

      // Buscar ou criar mês
      const mes = await this.prisma.indicadorMensal.findFirst({
        where: {
          indicadorCockpitId: indicadorId,
          ano: valor.ano,
          mes: valor.mes,
          periodoMentoriaId: periodoMentoria.id,
        },
      });

      if (mes) {
        // Atualizar existente
        return this.prisma.indicadorMensal.update({
          where: { id: mes.id },
          data: {
            meta: valor.meta,
            realizado: valor.realizado,
            historico: valor.historico,
            updatedBy: user.id,
          },
        });
      } else {
        // Criar novo vinculado ao período
        return this.prisma.indicadorMensal.create({
          data: {
            indicadorCockpitId: indicadorId,
            periodoMentoriaId: periodoMentoria.id,
            ano: valor.ano,
            mes: valor.mes,
            meta: valor.meta,
            realizado: valor.realizado,
            historico: valor.historico,
            createdBy: user.id,
            updatedBy: user.id,
          },
        });
      }
    });

    await Promise.all(updates);

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'IndicadorMensal',
      entidadeId: indicadorId,
      acao: 'UPDATE',
      dadosDepois: { valores: dto.valores, periodoMentoriaId: periodoMentoria.id },
    });

    // Retornar meses atualizados
    return this.prisma.indicadorMensal.findMany({
      where: {
        indicadorCockpitId: indicadorId,
      },
      orderBy: [{ ano: 'desc' }, { mes: 'asc' }],
    });
  }

  /**
   * Buscar valores mensais de um indicador por ano
   */
  async getMesesIndicador(
    indicadorId: string,
    ano: number,
    user: RequestUser,
  ) {
    const indicador = await this.prisma.indicadorCockpit.findUnique({
      where: { id: indicadorId },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador não encontrado');
    }

    await this.validateCockpitAccess(indicador.cockpitPilarId, user);

    return this.prisma.indicadorMensal.findMany({
      where: {
        indicadorCockpitId: indicadorId,
        ano,
      },
      orderBy: [{ mes: 'asc' }],
    });
  }

  // ==================== PROCESSOS PRIORITÁRIOS ====================

  /**
   * Listar processos prioritários do cockpit
   */
  async getProcessosPrioritarios(cockpitId: string, user: RequestUser) {
    await this.validateCockpitAccess(cockpitId, user);

    return this.prisma.processoPrioritario.findMany({
      where: {
        cockpitPilarId: cockpitId,
      },
      include: {
        rotinaEmpresa: {
          include: {
            notas: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Pega apenas a nota mais recente
            },
          },
        },
      },
      orderBy: { ordem: 'asc' },
    });
  }

  /**
   * Atualizar status de processo prioritário (mapeamento/treinamento)
   */
  async updateProcessoPrioritario(
    processoId: string,
    dto: UpdateProcessoPrioritarioDto,
    user: RequestUser,
  ) {
    const processo = await this.prisma.processoPrioritario.findUnique({
      where: { id: processoId },
      include: {
        rotinaEmpresa: true,
      },
    });

    if (!processo) {
      throw new NotFoundException('Processo prioritário não encontrado');
    }

    await this.validateCockpitAccess(processo.cockpitPilarId, user);

    const updated = await this.prisma.processoPrioritario.update({
      where: { id: processoId },
      data: {
        statusMapeamento: dto.statusMapeamento,
        statusTreinamento: dto.statusTreinamento,
        updatedBy: user.id,
      },
      include: {
        rotinaEmpresa: true,
      },
    });

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'ProcessoPrioritario',
      entidadeId: processoId,
      acao: 'UPDATE',
      dadosDepois: dto,
    });

    return updated;
  }

  // ==================== GRÁFICOS ====================

  /**
   * Buscar dados agregados para gráficos
   */
  async getDadosGraficos(
    cockpitId: string,
    ano: number,
    user: RequestUser,
    periodoMentoriaId?: string,
  ) {
    await this.validateCockpitAccess(cockpitId, user);

    // R-MENT-008: Filtrar por período de mentoria se fornecido
    const whereClause: any = periodoMentoriaId
      ? { periodoMentoriaId }
      : { ano };

    const indicadores = await this.prisma.indicadorCockpit.findMany({
      where: {
        cockpitPilarId: cockpitId,
        ativo: true,
      },
      include: {
        mesesIndicador: {
          where: whereClause,
          orderBy: [{ ano: 'asc' }, { mes: 'asc' }],
        },
        responsavelMedicao: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: { ordem: 'asc' },
    });

    return {
      ano,
      periodoMentoriaId,
      indicadores,
    };
  }
}
