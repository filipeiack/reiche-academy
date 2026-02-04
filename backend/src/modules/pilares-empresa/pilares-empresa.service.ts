import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';
import { CreatePilarEmpresaDto } from './dto/create-pilar-empresa.dto';
import { UpdatePilarEmpresaDto } from './dto/update-pilar-empresa.dto';
import { nowInSaoPaulo } from '../../common/utils/timezone';

@Injectable()
export class PilaresEmpresaService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) { }

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
      throw new ForbiddenException('Você não pode acessar dados de outra empresa');
    }
  }

  /**
   * Listar pilares ativos de uma empresa
   * Ordenados por PilarEmpresa.ordem (per-company ordering)
   * Retorna todos os pilares-empresa ativos, independente do status do template
   * (pilares customizados e pilares baseados em templates)
   */
  async findByEmpresa(empresaId: string, user: RequestUser) {
    this.validateTenantAccess(empresaId, user);

    return this.prisma.pilarEmpresa.findMany({
      where: {
        empresaId,
        ativo: true,
      },
      include: {
        pilarTemplate: {
          include: {
            _count: {
              select: {
                rotinas: true,
                empresas: true,
              },
            },
          },
        },
      },
      orderBy: { ordem: 'asc' },
    });
  }

  /**
   * Reordenar pilares de uma empresa específica
   * Atualiza campo PilarEmpresa.ordem (não Pilar.ordem)
   */
  async reordenar(
    empresaId: string,
    ordens: { id: string; ordem: number }[],
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Validar que IDs pertencem à empresa
    const idsToUpdate = ordens.map(item => item.id);

    const existingPilaresEmpresa = await this.prisma.pilarEmpresa.findMany({
      where: {
        id: { in: idsToUpdate },
        empresaId,
      },
      select: { id: true },
    });

    if (existingPilaresEmpresa.length !== idsToUpdate.length) {
      const foundIds = existingPilaresEmpresa.map((p: any) => p.id);
      const missingIds = idsToUpdate.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Pilares não encontrados nesta empresa: ${missingIds.join(', ')}`,
      );
    }

    // Atualizar ordens em transação
    const updates = ordens.map((item) =>
      this.prisma.pilarEmpresa.update({
        where: { id: item.id },
        data: {
          ordem: item.ordem,
          updatedBy: user.id,
        },
      }),
    );

    await this.prisma.$transaction(updates);

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'pilares_empresa',
      entidadeId: empresaId,
      acao: 'UPDATE',
      dadosAntes: null,
      dadosDepois: ordens,
    });

    return this.findByEmpresa(empresaId, user);
  }





  /**
   * Definir ou remover responsável de um pilar da empresa
   */
  async definirResponsavel(
    empresaId: string,
    pilarEmpresaId: string,
    responsavelId: string | null,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Buscar PilarEmpresa para validar existência e pertencimento à empresa
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: pilarEmpresaId },
      include: { pilarTemplate: true },
    });

    if (!pilarEmpresa) {
      throw new NotFoundException('Vínculo pilar-empresa não encontrado');
    }

    // Validar que o PilarEmpresa pertence à empresa correta
    if (pilarEmpresa.empresaId !== empresaId) {
      throw new ForbiddenException(
        'Este pilar não pertence à empresa especificada',
      );
    }

    // Se responsavelId for fornecido, validar que o usuário existe e pertence à empresa
    if (responsavelId) {
      const responsavel = await this.prisma.usuario.findUnique({
        where: { id: responsavelId },
      });

      if (!responsavel) {
        throw new NotFoundException('Usuário responsável não encontrado');
      }

      if (responsavel.empresaId !== empresaId) {
        throw new ForbiddenException(
          'O responsável deve pertencer à mesma empresa do pilar',
        );
      }
    }

    // Atualizar responsável
    const updated = await this.prisma.pilarEmpresa.update({
      where: { id: pilarEmpresaId },
      data: {
        responsavelId: responsavelId || null,
        updatedBy: user.id,
      },
      include: {
        pilarTemplate: true,
        responsavel: true,
      },
    });

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'pilares_empresa',
      entidadeId: pilarEmpresaId,
      acao: 'UPDATE',
      dadosAntes: { responsavelId: pilarEmpresa.responsavelId },
      dadosDepois: { responsavelId: responsavelId },
    });

    return updated;
  }

  /**
   * Atualizar nome do pilar da empresa
   */
  async updatePilarEmpresa(
    empresaId: string,
    pilarEmpresaId: string,
    dto: UpdatePilarEmpresaDto,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Buscar PilarEmpresa para validar existência e pertencimento à empresa
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: pilarEmpresaId },
    });

    if (!pilarEmpresa) {
      throw new NotFoundException('Vínculo pilar-empresa não encontrado');
    }

    // Validar que o PilarEmpresa pertence à empresa correta
    if (pilarEmpresa.empresaId !== empresaId) {
      throw new ForbiddenException(
        'Este pilar não pertence à empresa especificada',
      );
    }

    // Se nome fornecido, validar unicidade por empresa
    if (dto.nome) {
      const nomeExistente = await this.prisma.pilarEmpresa.findFirst({
        where: {
          empresaId,
          nome: dto.nome,
          ativo: true,
          id: { not: pilarEmpresaId }, // Excluir o próprio registro
        },
      });

      if (nomeExistente) {
        throw new ConflictException(
          `Já existe um pilar com o nome "${dto.nome}" nesta empresa`,
        );
      }
    }

    // Atualizar pilar
    const updated = await this.prisma.pilarEmpresa.update({
      where: { id: pilarEmpresaId },
      data: {
        nome: dto.nome,
        responsavelId: dto.responsavelId,
        updatedBy: user.id,
      },
      include: {
        pilarTemplate: true,
        responsavel: true,
      },
    });

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'pilares_empresa',
      entidadeId: pilarEmpresaId,
      acao: 'UPDATE',
      dadosAntes: { 
        nome: pilarEmpresa.nome,
        responsavelId: pilarEmpresa.responsavelId 
      },
      dadosDepois: { 
        nome: dto.nome ?? pilarEmpresa.nome,
        responsavelId: dto.responsavelId ?? pilarEmpresa.responsavelId
      },
    });

    return updated;
  }

  /**
   * Vincular múltiplos pilares templates a uma empresa
   * Adição incremental: ignora pilares já vinculados
   * Snapshot Pattern: Cria pilares E suas rotinas automaticamente
   */
  async vincularPilares(
    empresaId: string,
    pilaresIds: string[],
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Buscar templates existentes e ativos COM suas rotinas
    const templates = await this.prisma.pilar.findMany({
      where: {
        id: { in: pilaresIds },
        ativo: true,
      },
      include: {
        rotinas: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (templates.length === 0) {
      throw new NotFoundException('Nenhum template de pilar encontrado');
    }

    // Buscar pilares já vinculados à empresa
    const pilaresExistentes = await this.prisma.pilarEmpresa.findMany({
      where: {
        empresaId,
        pilarTemplateId: { in: pilaresIds },
      },
      select: { pilarTemplateId: true, nome: true },
    });

    const templateIdsExistentes = pilaresExistentes
      .map((p: any) => p.pilarTemplateId)
      .filter((id: any): id is string => id !== null);

    // Filtrar templates a serem criados (evitar duplicatas)
    const templatesParaCriar = templates.filter(
      (t: any) => !templateIdsExistentes.includes(t.id),
    );

    // Calcular próxima ordem para pilares
    const ultimoPilar = await this.prisma.pilarEmpresa.findFirst({
      where: { empresaId },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });

    let proximaOrdemPilar = ultimoPilar ? ultimoPilar.ordem + 1 : 1;

    // Criar pilares e rotinas em batch
    const pilaresVinculados = [];
    let totalRotinasVinculadas = 0;

    for (const template of templatesParaCriar) {
      // 1. Criar PilarEmpresa (snapshot do template)
      const pilarEmpresa = await this.prisma.pilarEmpresa.create({
        data: {
          pilarTemplateId: template.id,
          nome: template.nome,
          empresaId,
          ordem: proximaOrdemPilar++,
          createdBy: user.id,
          createdAt: nowInSaoPaulo(),
          updatedAt: nowInSaoPaulo(),
        },
        include: {
          pilarTemplate: true,
        },
      });

      pilaresVinculados.push(pilarEmpresa);

      // 2. Criar RotinaEmpresa (snapshots das rotinas do template)
      if (template.rotinas && template.rotinas.length > 0) {
        for (let i = 0; i < template.rotinas.length; i++) {
          const rotinaTemplate = template.rotinas[i];

          await this.prisma.rotinaEmpresa.create({
            data: {
              rotinaTemplateId: rotinaTemplate.id,
              nome: rotinaTemplate.nome,
              pilarEmpresaId: pilarEmpresa.id,
              ordem: i + 1, // Preservar ordem do template
              criticidade: rotinaTemplate.criticidade ?? null,
              createdBy: user.id,
            },
          });

          totalRotinasVinculadas++;
        }
      }
    }

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'pilares_empresa',
      entidadeId: empresaId,
      acao: 'CREATE',
      dadosAntes: null,
      dadosDepois: {
        pilaresVinculados: pilaresVinculados.length,
        rotinasVinculadas: totalRotinasVinculadas,
        pilaresIgnorados: templateIdsExistentes.length,
        templates: pilaresVinculados.map(p => ({ id: p.id, nome: p.nome })),
      },
    });

    // Retornar lista completa atualizada
    const todosPilares = await this.findByEmpresa(empresaId, user);

    return {
      vinculados: pilaresVinculados.length,
      ignorados: templateIdsExistentes,
      pilares: todosPilares,
    };
  }

  /**
   * R-PILEMP-001: Criar PilarEmpresa a partir de template
   * R-PILEMP-002: Criar PilarEmpresa customizado
   * Implementa Snapshot Pattern com validação XOR
   */
  async createPilarEmpresa(
    empresaId: string,
    dto: CreatePilarEmpresaDto,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    let nome: string;

    // XOR validation: pilarTemplateId OU nome (nunca ambos, nunca nenhum)
    if (dto.pilarTemplateId) {
      // Copiar dados do template
      const template = await this.prisma.pilar.findUnique({
        where: { id: dto.pilarTemplateId },
      });

      if (!template) {
        throw new NotFoundException('Template de pilar não encontrado');
      }

      nome = template.nome;
    } else {
      // Usar dados customizados (nome obrigatório via DTO validation)
      nome = dto.nome!;
    }

    // Validar nome único na empresa
    const existing = await this.prisma.pilarEmpresa.findFirst({
      where: {
        empresaId,
        nome,
      },
    });

    if (existing) {
      throw new ConflictException('Já existe um pilar com este nome nesta empresa');
    }

    // Calcular ordem (auto-increment)
    const ultimoPilar = await this.prisma.pilarEmpresa.findFirst({
      where: { empresaId },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });

    const proximaOrdem = ultimoPilar ? ultimoPilar.ordem + 1 : 1;

    // Criar snapshot
    const pilarEmpresa = await this.prisma.pilarEmpresa.create({
      data: {
        pilarTemplateId: dto.pilarTemplateId ?? null,
        nome,
        empresaId,
        ordem: proximaOrdem,
        createdBy: user.id,
        createdAt: nowInSaoPaulo(),
        updatedAt: nowInSaoPaulo(),
      },
      include: {
        pilarTemplate: true,
      },
    });

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'pilares_empresa',
      entidadeId: pilarEmpresa.id,
      acao: 'CREATE',
      dadosAntes: null,
      dadosDepois: {
        ...pilarEmpresa,
        isCustom: !dto.pilarTemplateId,
      },
    });

    return pilarEmpresa;
  }

  /**
   * R-PILEMP-006: Deleção em cascata com audit
   * Hard delete com cascade automático para rotinas e notas
   */
  async deletePilarEmpresa(
    empresaId: string,
    pilarEmpresaId: string,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Buscar pilar com rotinas e notas para auditoria completa
    const pilarEmpresa = await this.prisma.pilarEmpresa.findFirst({
      where: {
        id: pilarEmpresaId,
        empresaId,
      },
      include: {
        rotinasEmpresa: {
          include: {
            notas: true,
          },
        },
        _count: {
          select: { rotinasEmpresa: true },
        },
      },
    });

    if (!pilarEmpresa) {
      throw new NotFoundException('Pilar não encontrado nesta empresa');
    }

    // Coletar dados para auditoria ANTES da deleção
    const rotinasParaAuditoria = pilarEmpresa.rotinasEmpresa.map((rotina: any) => ({
      id: rotina.id,
      nome: rotina.nome,
      notasCount: rotina.notas.length,
      notas: rotina.notas.map((nota: any) => ({
        id: nota.id,
        nota: nota.nota,
        criticidade: nota.criticidade,
      })),
    }));

    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });

    // Hard delete (Prisma cascade deleta rotinas e notas automaticamente)
    await this.prisma.pilarEmpresa.delete({
      where: { id: pilarEmpresaId },
    });

    // Auditoria do pilar deletado
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'pilares_empresa',
      entidadeId: pilarEmpresaId,
      acao: 'DELETE',
      dadosAntes: {
        id: pilarEmpresa.id,
        nome: pilarEmpresa.nome,
        empresaId: pilarEmpresa.empresaId,
        pilarTemplateId: pilarEmpresa.pilarTemplateId,
        rotinasDeletadas: rotinasParaAuditoria.length,
        notasDeletadas: rotinasParaAuditoria.reduce((sum: any, r: any) => sum + r.notasCount, 0),
      },
      dadosDepois: null,
    });

    // Auditoria de rotinas deletadas em cascata
    for (const rotina of rotinasParaAuditoria) {
      await this.audit.log({
        usuarioId: user.id,
        usuarioNome: userRecord?.nome ?? '',
        usuarioEmail: userRecord?.email ?? '',
        entidade: 'rotinas_empresa',
        entidadeId: rotina.id,
        acao: 'DELETE',
        dadosAntes: {
          id: rotina.id,
          nome: rotina.nome,
          pilarEmpresaId,
          notasDeletadas: rotina.notasCount,
        },
        dadosDepois: null,
      });

      // Auditoria de notas deletadas em cascata
      for (const nota of rotina.notas) {
        await this.audit.log({
          usuarioId: user.id,
          usuarioNome: userRecord?.nome ?? '',
          usuarioEmail: userRecord?.email ?? '',
          entidade: 'notas_rotina',
          entidadeId: nota.id,
          acao: 'DELETE',
          dadosAntes: {
            id: nota.id,
            rotinaEmpresaId: rotina.id,
            nota: nota.nota,
            criticidade: nota.criticidade,
          },
          dadosDepois: null,
        });
      }
    }

    const totalRotinas = rotinasParaAuditoria.length;
    const totalNotas = rotinasParaAuditoria.reduce((sum: any, r: any) => sum + r.notasCount, 0);

    let message = 'Pilar removido com sucesso';
    if (totalRotinas > 0 || totalNotas > 0) {
      const details = [];
      if (totalRotinas > 0) details.push(`${totalRotinas} rotina(s)`);
      if (totalNotas > 0) details.push(`${totalNotas} nota(s)`);
      message += ` (removido em cascata: ${details.join(' e ')})`;
    }

    return { message };
  }
}
