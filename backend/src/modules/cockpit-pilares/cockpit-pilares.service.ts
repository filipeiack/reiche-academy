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
import { CreateProcessoFluxogramaDto } from './dto/create-processo-fluxograma.dto';
import { UpdateProcessoFluxogramaDto } from './dto/update-processo-fluxograma.dto';
import { ReordenarProcessoFluxogramaDto } from './dto/reordenar-processo-fluxograma.dto';
import { CreateCargoCockpitDto } from './dto/create-cargo-cockpit.dto';
import { UpdateCargoCockpitDto } from './dto/update-cargo-cockpit.dto';
import { CreateFuncaoCargoDto } from './dto/create-funcao-cargo.dto';
import { UpdateFuncaoCargoDto } from './dto/update-funcao-cargo.dto';
import { CreateAcaoCockpitDto } from './dto/create-acao-cockpit.dto';
import { UpdateAcaoCockpitDto } from './dto/update-acao-cockpit.dto';
import { StatusAcao } from '@prisma/client';
import { nowInSaoPaulo, parseDateInSaoPaulo } from '../../common/utils/timezone';

type AcaoCockpitComCockpit = {
  cockpitPilar: {
    pilarEmpresa: {
      empresa: {
        id: string;
      };
    };
  };
  inicioReal: Date | null;
  dataConclusao: Date | null;
} & Record<string, any>;

type AcaoCockpitComRelacoes = {
  responsavel: { id: string; nome: string; email: string | null } | null;
  indicadorCockpit: { id: string; nome: string } | null;
  indicadorMensal: { id: string; mes: number | null; ano: number } | null;
  inicioPrevisto?: Date | null;
  inicioReal?: Date | null;
  prazo?: Date | null;
  dataConclusao?: Date | null;
} & Record<string, any>;

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
   * Valida se o processo prioritário pertence à empresa do usuário
   */
  private async validateProcessoPrioritarioAccess(
    processoId: string,
    user: RequestUser,
  ) {
    const processo = await this.prisma.processoPrioritario.findUnique({
      where: { id: processoId },
      include: {
        cockpitPilar: {
          include: {
            pilarEmpresa: true,
          },
        },
        rotinaEmpresa: true,
      },
    });

    if (!processo) {
      throw new NotFoundException('Processo prioritário não encontrado');
    }

    if (user.perfil?.codigo !== 'ADMINISTRADOR') {
      if (processo.cockpitPilar.pilarEmpresa.empresaId !== user.empresaId) {
        throw new ForbiddenException(
          'Você não pode acessar processos de outra empresa',
        );
      }
    }

    return processo;
  }

  /**
   * Valida se o cargo pertence à empresa do usuário
   */
  private async validateCargoAccess(cargoId: string, user: RequestUser) {
    const cargo = await this.prisma.cargoCockpit.findUnique({
      where: { id: cargoId },
      include: {
        cockpitPilar: {
          include: {
            pilarEmpresa: {
              include: { empresa: true },
            },
          },
        },
      },
    });

    if (!cargo) {
      throw new NotFoundException('Cargo não encontrado');
    }

    if (user.perfil?.codigo !== 'ADMINISTRADOR') {
      if (cargo.cockpitPilar.pilarEmpresa.empresa.id !== user.empresaId) {
        throw new ForbiddenException(
          'Você não pode acessar cargos de outra empresa',
        );
      }
    }

    return cargo;
  }

  /**
   * Valida se a função pertence à empresa do usuário
   */
  private async validateFuncaoCargoAccess(funcaoId: string, user: RequestUser) {
    const funcao = await this.prisma.funcaoCargo.findUnique({
      where: { id: funcaoId },
      include: {
        cargoCockpit: {
          include: {
            cockpitPilar: {
              include: {
                pilarEmpresa: {
                  include: { empresa: true },
                },
              },
            },
          },
        },
      },
    });

    if (!funcao) {
      throw new NotFoundException('Função não encontrada');
    }

    if (user.perfil?.codigo !== 'ADMINISTRADOR') {
      if (
        funcao.cargoCockpit.cockpitPilar.pilarEmpresa.empresa.id !==
        user.empresaId
      ) {
        throw new ForbiddenException(
          'Você não pode acessar funções de outra empresa',
        );
      }
    }

    return funcao;
  }

  /**
   * Valida se a ação pertence à empresa do usuário
   */
  private async validateAcaoCockpitAccess(acaoId: string, user: RequestUser) {
    const acao = await this.prisma.acaoCockpit.findUnique({
      where: { id: acaoId },
      include: {
        cockpitPilar: {
          include: {
            pilarEmpresa: {
              include: { empresa: true },
            },
          },
        },
      },
    });

    const acaoTipada = acao as AcaoCockpitComCockpit | null;

    if (!acaoTipada) {
      throw new NotFoundException('Ação não encontrada');
    }

    if (user.perfil?.codigo !== 'ADMINISTRADOR') {
      if (acaoTipada.cockpitPilar.pilarEmpresa.empresa.id !== user.empresaId) {
        throw new ForbiddenException(
          'Você não pode acessar ações de outra empresa',
        );
      }
    }

    return acaoTipada;
  }

  private async validateUsuariosEmpresa(
    usuarioIds: string[],
    empresaId: string,
    user: RequestUser,
  ) {
    if (!usuarioIds?.length) return;

    const usuarios = await this.prisma.usuario.findMany({
      where: { id: { in: usuarioIds } },
      select: { id: true, empresaId: true },
    });

    if (usuarios.length !== usuarioIds.length) {
      throw new NotFoundException('Responsável não encontrado');
    }

    if (user.perfil?.codigo !== 'ADMINISTRADOR') {
      const outraEmpresa = usuarios.find((u) => u.empresaId !== empresaId);
      if (outraEmpresa) {
        throw new ForbiddenException(
          'Responsável deve ser da mesma empresa do cockpit',
        );
      }
    }
  }

  private getAgoraSaoPaulo(): Date {
    return nowInSaoPaulo();
  }

  private getStatusCalculado(
    inicioPrevisto?: Date | null,
    terminoPrevisto?: Date | null,
    inicioReal?: Date | null,
    terminoReal?: Date | null,
  ): string {
    if (terminoReal) {
      return 'CONCLUIDA';
    }

    const agora = this.getAgoraSaoPaulo();

    if (terminoPrevisto) {
      if (inicioReal) {
        if (inicioReal.getTime() > terminoPrevisto.getTime()) {
          return 'ATRASADA';
        }

        if (terminoPrevisto.getTime() < agora.getTime()) {
          return 'ATRASADA';
        }

        return 'EM_ANDAMENTO';
      }

      if (terminoPrevisto.getTime() < agora.getTime()) {
        return 'ATRASADA';
      }

      return 'A_INICIAR';
    }

    return 'A_INICIAR';
  }

  private sanitizeDescricao(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
      const processos = rotinas.map((rotina: any, index: number) => ({
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

    // Copiar indicadores templates (Snapshot Pattern) quando houver pilarTemplateId
    let indicadoresCopiados = 0;
    const indicadoresCriados: { id: string; nome: string }[] = [];

    if (pilarEmpresa.pilarTemplateId) {
      const templates = await (this.prisma as any).indicadorTemplate.findMany({
        where: {
          pilarId: pilarEmpresa.pilarTemplateId,
          ativo: true,
        },
        orderBy: { ordem: 'asc' },
      });

      if (templates.length > 0) {
        const anoAtual = new Date().getFullYear();

        await this.prisma.$transaction(async (tx) => {
          for (const template of templates) {
            const indicador = await tx.indicadorCockpit.create({
              data: {
                cockpitPilarId: cockpit.id,
                nome: template.nome,
                descricao: template.descricao,
                tipoMedida: template.tipoMedida,
                statusMedicao: template.statusMedicao,
                melhor: template.melhor,
                ordem: template.ordem,
                createdBy: user.id,
                updatedBy: user.id,
              },
            });

            const meses = Array.from({ length: 12 }, (_, i) => ({
              indicadorCockpitId: indicador.id,
              mes: i + 1,
              ano: anoAtual,
              createdBy: user.id,
              updatedBy: user.id,
            }));

            await tx.indicadorMensal.createMany({
              data: meses,
            });

            indicadoresCriados.push({ id: indicador.id, nome: indicador.nome });
            indicadoresCopiados += 1;
          }
        });
      }
    }

    if (indicadoresCriados.length > 0) {
      for (const indicador of indicadoresCriados) {
        await this.audit.log({
          usuarioId: user.id,
          usuarioNome: user.nome,
          usuarioEmail: user.email ?? '',
          entidade: 'IndicadorCockpit',
          entidadeId: indicador.id,
          acao: 'CREATE',
          dadosDepois: { origem: 'template', nome: indicador.nome, cockpitId: cockpit.id },
        });
      }
    }

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'CockpitPilar',
      entidadeId: cockpit.id,
      acao: 'CREATE',
      dadosDepois: {
        cockpitId: cockpit.id,
        pilarNome: pilarEmpresa.nome,
        processosVinculados: rotinas.length,
        indicadoresCopiados,
      },
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
   * Buscar objetivo template para pré-preenchimento ao criar cockpit
   */
  async getObjetivoTemplateForPilarEmpresa(
    empresaId: string,
    pilarEmpresaId: string,
    user: RequestUser,
  ) {
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: pilarEmpresaId },
      include: {
        empresa: true,
      },
    });

    if (!pilarEmpresa) {
      throw new NotFoundException('Pilar não encontrado');
    }

    if (pilarEmpresa.empresaId !== empresaId) {
      throw new NotFoundException('Pilar não encontrado');
    }

    this.validateTenantAccess(pilarEmpresa.empresaId, user);

    if (!pilarEmpresa.pilarTemplateId) {
      return null;
    }

    return (this.prisma as any).objetivoTemplate.findUnique({
      where: { pilarId: pilarEmpresa.pilarTemplateId },
      select: {
        id: true,
        pilarId: true,
        entradas: true,
        saidas: true,
        missao: true,
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
    const cockpit = await this.validateCockpitAccess(cockpitId, user);

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
              orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
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
   * Criar indicador com auto-criação de 12 meses consecutivos
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

    // Auto-criar 12 meses consecutivos a partir do mês atual
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1; // 1-12
    const anoAtual = agora.getFullYear();
    const meses = [];

    for (let i = 0; i < 12; i++) {
      let mes = mesAtual + i;
      let ano = anoAtual;
      
      // Ajustar ano se ultrapassar dezembro
      if (mes > 12) {
        mes = mes - 12;
        ano++;
      }
      
      meses.push({
        indicadorCockpitId: indicador.id,
        mes,
        ano,
        createdBy: user.id,
        updatedBy: user.id,
      });
    }

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

    // Atualizar cada valor mensal
    const updates = dto.valores.map(async (valor) => {
      // Buscar ou criar mês
      const mes = await this.prisma.indicadorMensal.findFirst({
        where: {
          indicadorCockpitId: indicadorId,
          ano: valor.ano,
          mes: valor.mes,
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
        // Criar novo
        return this.prisma.indicadorMensal.create({
          data: {
            indicadorCockpitId: indicadorId,
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
      dadosDepois: { valores: dto.valores },
    });

    // Retornar meses atualizados
    return this.prisma.indicadorMensal.findMany({
      where: {
        indicadorCockpitId: indicadorId,
      },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
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
      include: {
        cockpitPilar: true,
      },
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

  /**
   * Criar novo ciclo de 12 meses para todos os indicadores do cockpit
   * Validação: só pode criar se mês atual >= último mês do período de mentoria
   */
  async criarNovoCicloMeses(cockpitId: string, user: RequestUser) {
    const cockpit = await this.validateCockpitAccess(cockpitId, user);

    // Validar período de mentoria ativo
    let periodoAtivo: { id: string; dataFim: Date } | null = null;
    if (
      (this.prisma as any).periodoMentoria &&
      typeof (this.prisma as any).periodoMentoria.findFirst === 'function'
    ) {
      periodoAtivo = await (this.prisma as any).periodoMentoria.findFirst({
        where: {
          empresaId: cockpit.pilarEmpresa.empresaId,
          ativo: true,
        },
      });
    }

    if (!periodoAtivo) {
      throw new BadRequestException(
        'Empresa não possui período de mentoria ativo',
      );
    }

    // Validar que mês atual >= último mês do período
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1; // 1-12
    const anoAtual = agora.getFullYear();
    const anoMesAtual = anoAtual * 100 + mesAtual;
    
    const dataFim = periodoAtivo.dataFim;
    const mesFim = dataFim.getMonth() + 1;
    const anoFim = dataFim.getFullYear();
    const anoMesFim = anoFim * 100 + mesFim;

    if (anoMesAtual < anoMesFim) {
      throw new BadRequestException(
        `Não é possível criar novo ciclo. O período de mentoria atual ainda não encerrou (término: ${mesFim.toString().padStart(2, '0')}/${anoFim})`,
      );
    }

    // Buscar todos os indicadores ativos do cockpit
    const indicadores = await this.prisma.indicadorCockpit.findMany({
      where: {
        cockpitPilarId: cockpitId,
        ativo: true,
      },
      include: {
        mesesIndicador: {
          orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
          take: 1,
        },
      },
    });

    if (indicadores.length === 0) {
      throw new BadRequestException('Cockpit não possui indicadores ativos');
    }

    // Para cada indicador, calcular próximos 12 meses a partir do último registrado
    const mesesParaCriar = [];
    
    for (const indicador of indicadores) {
      let mesInicial: number;
      let anoInicial: number;

      if (indicador.mesesIndicador.length > 0) {
        const ultimoMes = indicador.mesesIndicador[0];
        mesInicial = (ultimoMes.mes ?? 12) + 1;
        anoInicial = ultimoMes.ano;
        
        if (mesInicial > 12) {
          mesInicial = 1;
          anoInicial++;
        }
      } else {
        // Se não há meses, começar do mês atual
        mesInicial = mesAtual;
        anoInicial = anoAtual;
      }

      // Criar 12 meses consecutivos
      for (let i = 0; i < 12; i++) {
        let mes = mesInicial + i;
        let ano = anoInicial;
        
        if (mes > 12) {
          mes = mes - 12;
          ano++;
        }

        mesesParaCriar.push({
          indicadorCockpitId: indicador.id,
          mes,
          ano,
          createdBy: user.id,
          updatedBy: user.id,
        });
      }
    }

    // Inserir em lote
    await this.prisma.indicadorMensal.createMany({
      data: mesesParaCriar,
      skipDuplicates: true, // Ignora se já existir (unique constraint)
    });

    // Auditoria
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'CockpitPilar',
      entidadeId: cockpitId,
      acao: 'CREATE',
      dadosDepois: { 
        acao: 'criar_novo_ciclo_meses',
        indicadores: indicadores.length,
        mesesCriados: mesesParaCriar.length,
      },
    });

    return {
      sucesso: true,
      indicadores: indicadores.length,
      mesesCriados: mesesParaCriar.length,
    };
  }

  // ==================== CARGOS E FUNÇÕES ====================

  async getCargosByCockpit(cockpitId: string, user: RequestUser) {
    await this.validateCockpitAccess(cockpitId, user);

    return this.prisma.cargoCockpit.findMany({
      where: { cockpitPilarId: cockpitId },
      orderBy: { ordem: 'asc' },
      include: {
        responsaveis: {
          include: {
            usuario: {
              select: { id: true, nome: true, email: true },
            },
          },
        },
        funcoes: {
          orderBy: { ordem: 'asc' },
        },
      },
    });
  }

  async createCargo(
    cockpitId: string,
    dto: CreateCargoCockpitDto,
    user: RequestUser,
  ) {
    const cockpit = await this.validateCockpitAccess(cockpitId, user);

    if (dto.responsavelIds?.length) {
      await this.validateUsuariosEmpresa(
        dto.responsavelIds,
        cockpit.pilarEmpresa.empresa.id,
        user,
      );
    }

    const maxOrdem = await this.prisma.cargoCockpit.findFirst({
      where: { cockpitPilarId: cockpitId },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });

    const ordem = dto.ordem ?? (maxOrdem ? maxOrdem.ordem + 1 : 1);

    const cargo = await this.prisma.cargoCockpit.create({
      data: {
        cockpitPilarId: cockpitId,
        cargo: dto.cargo,
        ordem,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    if (dto.responsavelIds?.length) {
      await this.prisma.cargoCockpitResponsavel.createMany({
        data: dto.responsavelIds.map((usuarioId) => ({
          cargoCockpitId: cargo.id,
          usuarioId,
        })),
      });
    }

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'CargoCockpit',
      entidadeId: cargo.id,
      acao: 'CREATE',
      dadosDepois: { cargo: dto.cargo, cockpitId },
    });

    return this.prisma.cargoCockpit.findUnique({
      where: { id: cargo.id },
      include: {
        responsaveis: {
          include: {
            usuario: { select: { id: true, nome: true, email: true } },
          },
        },
        funcoes: { orderBy: { ordem: 'asc' } },
      },
    });
  }

  async updateCargo(
    cargoId: string,
    dto: UpdateCargoCockpitDto,
    user: RequestUser,
  ) {
    const cargo = await this.validateCargoAccess(cargoId, user);

    if (dto.responsavelIds) {
      await this.validateUsuariosEmpresa(
        dto.responsavelIds,
        cargo.cockpitPilar.pilarEmpresa.empresa.id,
        user,
      );
    }

    await this.prisma.cargoCockpit.update({
      where: { id: cargoId },
      data: {
        cargo: dto.cargo ?? undefined,
        ordem: dto.ordem ?? undefined,
        updatedBy: user.id,
      },
    });

    if (dto.responsavelIds) {
      await this.prisma.cargoCockpitResponsavel.deleteMany({
        where: { cargoCockpitId: cargoId },
      });

      if (dto.responsavelIds.length) {
        await this.prisma.cargoCockpitResponsavel.createMany({
          data: dto.responsavelIds.map((usuarioId) => ({
            cargoCockpitId: cargoId,
            usuarioId,
          })),
        });
      }
    }

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'CargoCockpit',
      entidadeId: cargoId,
      acao: 'UPDATE',
      dadosDepois: dto,
    });

    return this.prisma.cargoCockpit.findUnique({
      where: { id: cargoId },
      include: {
        responsaveis: {
          include: {
            usuario: { select: { id: true, nome: true, email: true } },
          },
        },
        funcoes: { orderBy: { ordem: 'asc' } },
      },
    });
  }

  async deleteCargo(cargoId: string, user: RequestUser) {
    const cargo = await this.validateCargoAccess(cargoId, user);

    await this.prisma.cargoCockpit.delete({
      where: { id: cargoId },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'CargoCockpit',
      entidadeId: cargoId,
      acao: 'DELETE',
      dadosDepois: { cargo: cargo.cargo },
    });

    return { message: 'Cargo removido com sucesso' };
  }

  async createFuncaoCargo(
    cargoId: string,
    dto: CreateFuncaoCargoDto,
    user: RequestUser,
  ) {
    await this.validateCargoAccess(cargoId, user);

    const maxOrdem = await this.prisma.funcaoCargo.findFirst({
      where: { cargoCockpitId: cargoId },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });

    const ordem = dto.ordem ?? (maxOrdem ? maxOrdem.ordem + 1 : 1);

    const funcao = await this.prisma.funcaoCargo.create({
      data: {
        cargoCockpitId: cargoId,
        descricao: this.sanitizeDescricao(dto.descricao),
        nivelCritico: dto.nivelCritico,
        autoAvaliacao: dto.autoAvaliacao,
        avaliacaoLideranca: dto.avaliacaoLideranca,
        ordem,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'FuncaoCargo',
      entidadeId: funcao.id,
      acao: 'CREATE',
      dadosDepois: { descricao: dto.descricao, cargoId },
    });

    return funcao;
  }

  async updateFuncaoCargo(
    funcaoId: string,
    dto: UpdateFuncaoCargoDto,
    user: RequestUser,
  ) {
    await this.validateFuncaoCargoAccess(funcaoId, user);

    const updated = await this.prisma.funcaoCargo.update({
      where: { id: funcaoId },
      data: {
        descricao: dto.descricao
          ? this.sanitizeDescricao(dto.descricao)
          : undefined,
        nivelCritico: dto.nivelCritico,
        autoAvaliacao: dto.autoAvaliacao,
        avaliacaoLideranca: dto.avaliacaoLideranca,
        ordem: dto.ordem,
        updatedBy: user.id,
      },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'FuncaoCargo',
      entidadeId: funcaoId,
      acao: 'UPDATE',
      dadosDepois: dto,
    });

    return updated;
  }

  async deleteFuncaoCargo(funcaoId: string, user: RequestUser) {
    const funcao = await this.validateFuncaoCargoAccess(funcaoId, user);

    await this.prisma.funcaoCargo.delete({
      where: { id: funcaoId },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'FuncaoCargo',
      entidadeId: funcaoId,
      acao: 'DELETE',
      dadosDepois: { descricao: funcao.descricao },
    });

    return { message: 'Função removida com sucesso' };
  }

  // ==================== PLANO DE AÇÃO ESPECÍFICO ====================

  async getAcoesCockpit(cockpitId: string, user: RequestUser) {
    await this.validateCockpitAccess(cockpitId, user);

    const acoes = (await this.prisma.acaoCockpit.findMany({
      where: { cockpitPilarId: cockpitId },
      orderBy: { createdAt: 'desc' },
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        indicadorCockpit: { select: { id: true, nome: true } },
        indicadorMensal: { select: { id: true, mes: true, ano: true } },
      },
    })) as AcaoCockpitComRelacoes[];

    return acoes.map((acao) => ({
      ...acao,
      statusCalculado: this.getStatusCalculado(
        acao.inicioPrevisto,
        acao.prazo,
        acao.inicioReal,
        acao.dataConclusao,
      ),
    }));
  }

  async createAcaoCockpit(
    cockpitId: string,
    dto: CreateAcaoCockpitDto,
    user: RequestUser,
  ) {
    const cockpit = await this.validateCockpitAccess(cockpitId, user);

    const indicadorMensal = await this.prisma.indicadorMensal.findUnique({
      where: { id: dto.indicadorMensalId },
      include: {
        indicadorCockpit: {
          include: {
            cockpitPilar: true,
          },
        },
      },
    });

    if (!indicadorMensal) {
      throw new NotFoundException('Mês do indicador não encontrado');
    }

    if (indicadorMensal.indicadorCockpit.cockpitPilarId !== cockpitId) {
      throw new ForbiddenException('Mês do indicador não pertence ao cockpit');
    }

    if (dto.responsavelId) {
      await this.validateUsuariosEmpresa(
        [dto.responsavelId],
        cockpit.pilarEmpresa.empresa.id,
        user,
      );
    }

    if (dto.terminoReal && !dto.inicioReal) {
      throw new BadRequestException(
        'Data de término real não pode ser informada antes da data de início real',
      );
    }

    if (dto.inicioReal && dto.terminoReal) {
      const inicioReal = parseDateInSaoPaulo(dto.inicioReal);
      const terminoReal = parseDateInSaoPaulo(dto.terminoReal);
      if (terminoReal.getTime() < inicioReal.getTime()) {
        throw new BadRequestException(
          'Data de término real não pode ser anterior à data de início real',
        );
      }
    }

    const acao = await this.prisma.acaoCockpit.create({
      data: {
        cockpitPilarId: cockpitId,
        indicadorCockpitId: indicadorMensal.indicadorCockpitId,
        indicadorMensalId: indicadorMensal.id,
        causa1: dto.causa1 ? this.sanitizeDescricao(dto.causa1) : null,
        causa2: dto.causa2 ? this.sanitizeDescricao(dto.causa2) : null,
        causa3: dto.causa3 ? this.sanitizeDescricao(dto.causa3) : null,
        causa4: dto.causa4 ? this.sanitizeDescricao(dto.causa4) : null,
        causa5: dto.causa5 ? this.sanitizeDescricao(dto.causa5) : null,
        acaoProposta: this.sanitizeDescricao(dto.acaoProposta),
        responsavelId: dto.responsavelId,
        status: dto.terminoReal ? StatusAcao.CONCLUIDA : StatusAcao.PENDENTE,
        inicioPrevisto: parseDateInSaoPaulo(dto.inicioPrevisto),
        inicioReal: dto.inicioReal ? parseDateInSaoPaulo(dto.inicioReal) : null,
        prazo: parseDateInSaoPaulo(dto.terminoPrevisto),
        dataConclusao: dto.terminoReal ? parseDateInSaoPaulo(dto.terminoReal) : null,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'AcaoCockpit',
      entidadeId: acao.id,
      acao: 'CREATE',
      dadosDepois: { indicadorMensalId: dto.indicadorMensalId, cockpitId },
    });

    const created = (await this.prisma.acaoCockpit.findUnique({
      where: { id: acao.id },
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        indicadorCockpit: { select: { id: true, nome: true } },
        indicadorMensal: { select: { id: true, mes: true, ano: true } },
      },
    })) as AcaoCockpitComRelacoes | null;

    if (!created) {
      throw new NotFoundException('Ação não encontrada');
    }

    return {
      ...created,
      statusCalculado: this.getStatusCalculado(
        created.inicioPrevisto,
        created.prazo,
        created.inicioReal,
        created.dataConclusao,
      ),
    };
  }

  async updateAcaoCockpit(
    acaoId: string,
    dto: UpdateAcaoCockpitDto,
    user: RequestUser,
  ) {
    const acao = await this.validateAcaoCockpitAccess(acaoId, user);

    let indicadorMensalId: string | undefined;
    let indicadorCockpitId: string | undefined;

    if (dto.indicadorMensalId) {
      const indicadorMensal = await this.prisma.indicadorMensal.findUnique({
        where: { id: dto.indicadorMensalId },
        include: {
          indicadorCockpit: {
            include: {
              cockpitPilar: true,
            },
          },
        },
      });

      if (!indicadorMensal) {
        throw new NotFoundException('Mês do indicador não encontrado');
      }

      if (indicadorMensal.indicadorCockpit.cockpitPilarId !== acao.cockpitPilarId) {
        throw new ForbiddenException('Mês do indicador não pertence ao cockpit');
      }

      indicadorMensalId = indicadorMensal.id;
      indicadorCockpitId = indicadorMensal.indicadorCockpitId;
    }

    if (dto.responsavelId) {
      await this.validateUsuariosEmpresa(
        [dto.responsavelId],
        acao.cockpitPilar.pilarEmpresa.empresa.id,
        user,
      );
    }

    const inicioRealDto = dto.inicioReal
      ? parseDateInSaoPaulo(dto.inicioReal)
      : undefined;
    const terminoRealDto = dto.terminoReal
      ? parseDateInSaoPaulo(dto.terminoReal)
      : undefined;

    if (dto.terminoReal && !dto.inicioReal && !acao.inicioReal) {
      throw new BadRequestException(
        'Data de término real não pode ser informada antes da data de início real',
      );
    }

    const inicioRealValidar = inicioRealDto ?? acao.inicioReal ?? null;
    const terminoRealValidar = terminoRealDto ?? acao.dataConclusao ?? null;

    if (inicioRealValidar && terminoRealValidar) {
      if (terminoRealValidar.getTime() < inicioRealValidar.getTime()) {
        throw new BadRequestException(
          'Data de término real não pode ser anterior à data de início real',
        );
      }
    }

    await this.prisma.acaoCockpit.update({
      where: { id: acaoId },
      data: {
        indicadorMensalId,
        indicadorCockpitId,
        causa1:
          dto.causa1 !== undefined
            ? dto.causa1
              ? this.sanitizeDescricao(dto.causa1)
              : null
            : undefined,
        causa2:
          dto.causa2 !== undefined
            ? dto.causa2
              ? this.sanitizeDescricao(dto.causa2)
              : null
            : undefined,
        causa3:
          dto.causa3 !== undefined
            ? dto.causa3
              ? this.sanitizeDescricao(dto.causa3)
              : null
            : undefined,
        causa4:
          dto.causa4 !== undefined
            ? dto.causa4
              ? this.sanitizeDescricao(dto.causa4)
              : null
            : undefined,
        causa5:
          dto.causa5 !== undefined
            ? dto.causa5
              ? this.sanitizeDescricao(dto.causa5)
              : null
            : undefined,
        acaoProposta: dto.acaoProposta
          ? this.sanitizeDescricao(dto.acaoProposta)
          : undefined,
        responsavelId: dto.responsavelId,
        status:
          dto.terminoReal !== undefined
            ? dto.terminoReal
              ? StatusAcao.CONCLUIDA
              : StatusAcao.PENDENTE
            : undefined,
        inicioPrevisto:
          dto.inicioPrevisto !== undefined
            ? dto.inicioPrevisto
              ? parseDateInSaoPaulo(dto.inicioPrevisto)
              : null
            : undefined,
        inicioReal:
          dto.inicioReal !== undefined
            ? dto.inicioReal
              ? parseDateInSaoPaulo(dto.inicioReal)
              : null
            : undefined,
        prazo:
          dto.terminoPrevisto !== undefined
            ? dto.terminoPrevisto
              ? parseDateInSaoPaulo(dto.terminoPrevisto)
              : null
            : undefined,
        dataConclusao:
          dto.terminoReal !== undefined
            ? dto.terminoReal
              ? parseDateInSaoPaulo(dto.terminoReal)
              : null
            : undefined,
        updatedBy: user.id,
      },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'AcaoCockpit',
      entidadeId: acaoId,
      acao: 'UPDATE',
      dadosDepois: dto,
    });

    const result = (await this.prisma.acaoCockpit.findUnique({
      where: { id: acaoId },
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        indicadorCockpit: { select: { id: true, nome: true } },
        indicadorMensal: { select: { id: true, mes: true, ano: true } },
      },
    })) as AcaoCockpitComRelacoes | null;

    if (!result) {
      throw new NotFoundException('Ação não encontrada');
    }

    return {
      ...result,
      statusCalculado: this.getStatusCalculado(
        result.inicioPrevisto,
        result.prazo,
        result.inicioReal,
        result.dataConclusao,
      ),
    };
  }

  async deleteAcaoCockpit(acaoId: string, user: RequestUser) {
    const acao = await this.validateAcaoCockpitAccess(acaoId, user);

    await this.prisma.acaoCockpit.delete({
      where: { id: acaoId },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'AcaoCockpit',
      entidadeId: acaoId,
      acao: 'DELETE',
      dadosDepois: { acaoProposta: acao.acaoProposta },
    });

    return { message: 'Ação removida com sucesso' };
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
        _count: {
          select: {
            fluxogramaAcoes: true,
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
    const processo = await this.validateProcessoPrioritarioAccess(
      processoId,
      user,
    );

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
      dadosAntes: {
        statusMapeamento: processo.statusMapeamento,
        statusTreinamento: processo.statusTreinamento,
      },
      dadosDepois: dto,
    });

    return updated;
  }

  // ==================== FLUXOGRAMA DE PROCESSOS ====================

  async getProcessoFluxograma(processoId: string, user: RequestUser) {
    await this.validateProcessoPrioritarioAccess(processoId, user);

    return this.prisma.processoFluxograma.findMany({
      where: {
        processoPrioritarioId: processoId,
      },
      orderBy: { ordem: 'asc' },
      select: {
        id: true,
        processoPrioritarioId: true,
        descricao: true,
        ordem: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createProcessoFluxograma(
    processoId: string,
    dto: CreateProcessoFluxogramaDto,
    user: RequestUser,
  ) {
    await this.validateProcessoPrioritarioAccess(processoId, user);

    const descricao = this.sanitizeDescricao(dto.descricao.trim());

    if (descricao.length < 10 || descricao.length > 300) {
      throw new BadRequestException(
        'A descrição deve ter entre 10 e 300 caracteres',
      );
    }

    const maxOrdem = await this.prisma.processoFluxograma.findFirst({
      where: {
        processoPrioritarioId: processoId,
      },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });

    const ordem = maxOrdem ? maxOrdem.ordem + 1 : 1;

    const created = await this.prisma.processoFluxograma.create({
      data: {
        processoPrioritarioId: processoId,
        descricao,
        ordem,
        createdBy: user.id,
        updatedBy: user.id,
      },
      select: {
        id: true,
        processoPrioritarioId: true,
        descricao: true,
        ordem: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'ProcessoFluxograma',
      entidadeId: created.id,
      acao: 'CREATE',
      dadosDepois: created,
    });

    return created;
  }

  async updateProcessoFluxograma(
    processoId: string,
    acaoId: string,
    dto: UpdateProcessoFluxogramaDto,
    user: RequestUser,
  ) {
    await this.validateProcessoPrioritarioAccess(processoId, user);

    const acao = await this.prisma.processoFluxograma.findFirst({
      where: {
        id: acaoId,
        processoPrioritarioId: processoId,
      },
    });

    if (!acao) {
      throw new NotFoundException('Ação do fluxograma não encontrada');
    }

    const descricaoRaw = dto.descricao?.trim();

    if (!descricaoRaw || descricaoRaw.length < 10 || descricaoRaw.length > 300) {
      throw new BadRequestException(
        'A descrição deve ter entre 10 e 300 caracteres',
      );
    }

    const descricao = this.sanitizeDescricao(descricaoRaw);

    const updated = await this.prisma.processoFluxograma.update({
      where: { id: acaoId },
      data: {
        descricao,
        updatedBy: user.id,
      },
      select: {
        id: true,
        processoPrioritarioId: true,
        descricao: true,
        ordem: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'ProcessoFluxograma',
      entidadeId: acaoId,
      acao: 'UPDATE',
      dadosAntes: {
        descricao: acao.descricao,
        ordem: acao.ordem,
      },
      dadosDepois: {
        descricao: updated.descricao,
        ordem: updated.ordem,
      },
    });

    return updated;
  }

  async deleteProcessoFluxograma(
    processoId: string,
    acaoId: string,
    user: RequestUser,
  ) {
    await this.validateProcessoPrioritarioAccess(processoId, user);

    const acao = await this.prisma.processoFluxograma.findFirst({
      where: {
        id: acaoId,
        processoPrioritarioId: processoId,
      },
    });

    if (!acao) {
      throw new NotFoundException('Ação do fluxograma não encontrada');
    }

    await this.prisma.processoFluxograma.delete({
      where: { id: acaoId },
    });

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'ProcessoFluxograma',
      entidadeId: acaoId,
      acao: 'DELETE',
      dadosAntes: {
        descricao: acao.descricao,
        ordem: acao.ordem,
      },
    });

    return { message: 'Ação removida com sucesso' };
  }

  async reordenarProcessoFluxograma(
    processoId: string,
    dto: ReordenarProcessoFluxogramaDto,
    user: RequestUser,
  ) {
    await this.validateProcessoPrioritarioAccess(processoId, user);

    const acoes = await this.prisma.processoFluxograma.findMany({
      where: {
        processoPrioritarioId: processoId,
      },
      select: {
        id: true,
        ordem: true,
      },
      orderBy: { ordem: 'asc' },
    });

    const idsExistentes = new Set(acoes.map((acao) => acao.id));
    const idsAtualizacao = new Set(dto.ordens.map((ordem) => ordem.id));

    if (idsExistentes.size !== idsAtualizacao.size) {
      throw new BadRequestException(
        'Lista de ações inválida para reordenação',
      );
    }

    for (const ordem of dto.ordens) {
      if (!idsExistentes.has(ordem.id)) {
        throw new BadRequestException(
          'Lista de ações inválida para reordenação',
        );
      }
    }

    const ordensOrdenadas = [...dto.ordens]
      .map((ordem) => ordem.ordem)
      .sort((a, b) => a - b);

    const ordensValidas = ordensOrdenadas.every(
      (ordem, index) => ordem === index + 1,
    );

    if (!ordensValidas) {
      throw new BadRequestException(
        'A ordem das ações deve ser sequencial (1, 2, 3, ...)',
      );
    }

    await this.prisma.$transaction(
      dto.ordens.map((ordem) =>
        this.prisma.processoFluxograma.update({
          where: { id: ordem.id },
          data: {
            ordem: ordem.ordem,
            updatedBy: user.id,
          },
        }),
      ),
    );

    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email ?? '',
      entidade: 'ProcessoFluxograma',
      entidadeId: processoId,
      acao: 'UPDATE',
      dadosAntes: acoes,
      dadosDepois: dto.ordens,
    });

    return { message: 'Ordem atualizada com sucesso' };
  }

  // ==================== GRÁFICOS ====================

  /**
   * R-GRAF-001: Buscar anos disponíveis (com meses criados) para um cockpit
   */
  async getAnosDisponiveis(cockpitId: string, user: RequestUser) {
    await this.validateCockpitAccess(cockpitId, user);

    // Buscar anos distintos de IndicadorMensal para indicadores deste cockpit
    const anos = await this.prisma.indicadorMensal.findMany({
      where: {
        indicadorCockpit: {
          cockpitPilarId: cockpitId,
          ativo: true,
        },
      },
      select: {
        ano: true,
      },
      distinct: ['ano'],
      orderBy: {
        ano: 'desc',
      },
    });

    return anos.map((item: any) => item.ano);
  }

  /**
   * R-GRAF-001: Buscar dados agregados para gráficos
   * @param filtro - 'ultimos-12-meses' ou ano específico (ex: '2025')
   */
  async getDadosGraficos(
    cockpitId: string,
    filtro: string,
    user: RequestUser,
  ) {
    await this.validateCockpitAccess(cockpitId, user);

    let whereClause: any = {};
    let tipoFiltro: 'ultimos-12-meses' | 'ano' = 'ano';

    if (filtro === 'ultimos-12-meses') {
      // Buscar últimos 12 meses a partir de hoje
      tipoFiltro = 'ultimos-12-meses';
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1; // 1-12
      const anoAtual = hoje.getFullYear();
      
      // Calcular mês/ano inicial (12 meses atrás)
      let mesInicial = mesAtual - 11;
      let anoInicial = anoAtual;
      
      if (mesInicial <= 0) {
        mesInicial += 12;
        anoInicial -= 1;
      }

      // Filtro: (ano > anoInicial) OR (ano = anoInicial AND mes >= mesInicial)
      whereClause = {
        OR: [
          {
            ano: {
              gt: anoInicial,
            },
          },
          {
            AND: [
              { ano: anoInicial },
              { mes: { gte: mesInicial } },
            ],
          },
        ],
        AND: [
          {
            ano: {
              lte: anoAtual,
            },
          },
          {
            OR: [
              { ano: { lt: anoAtual } },
              { mes: { lte: mesAtual } },
            ],
          },
        ],
      };
    } else {
      // Filtro por ano específico
      const ano = parseInt(filtro, 10);
      if (isNaN(ano)) {
        throw new BadRequestException(
          'Filtro inválido. Use "ultimos-12-meses" ou um ano válido (ex: 2025)',
        );
      }
      whereClause = { ano };
    }

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
      filtro,
      tipoFiltro,
      indicadores,
    };
  }
}
