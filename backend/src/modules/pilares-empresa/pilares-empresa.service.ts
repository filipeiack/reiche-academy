import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PilaresEmpresaService {
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
      throw new ForbiddenException('Você não pode acessar dados de outra empresa');
    }
  }

  /**
   * Listar pilares ativos de uma empresa
   * Ordenados por PilarEmpresa.ordem (per-company ordering)
   * Filtra pilares inativos (cascata lógica - Decisão 4)
   */
  async findByEmpresa(empresaId: string, user: RequestUser) {
    this.validateTenantAccess(empresaId, user);

    return this.prisma.pilarEmpresa.findMany({
      where: {
        empresaId,
        ativo: true,
        pilar: { ativo: true }, // Filtro de cascata lógica
      },
      include: {
        pilar: {
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
      const foundIds = existingPilaresEmpresa.map(p => p.id);
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
   * Vincular pilares a uma empresa (adição incremental)
   * Adiciona novos vínculos SEM deletar existentes
   * Implementa R-PILEMP-003
   */
  async vincularPilares(
    empresaId: string,
    pilaresIds: string[],
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Filtrar pilares já vinculados (evitar duplicatas)
    const jaVinculados = await this.prisma.pilarEmpresa.findMany({
      where: {
        empresaId,
        pilarId: { in: pilaresIds },
      },
      select: { pilarId: true },
    });

    const idsJaVinculados = jaVinculados.map(v => v.pilarId);
    const novosIds = pilaresIds.filter(id => !idsJaVinculados.includes(id));

    // Validar que pilares existem e estão ativos
    const pilares = await this.prisma.pilar.findMany({
      where: {
        id: { in: novosIds },
        ativo: true,
      },
    });

    if (pilares.length !== novosIds.length) {
      const foundIds = pilares.map(p => p.id);
      const invalidIds = novosIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Pilares não encontrados ou inativos: ${invalidIds.join(', ')}`,
      );
    }

    // Calcular próxima ordem disponível
    const maxOrdem = await this.prisma.pilarEmpresa.findFirst({
      where: { empresaId },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });

    const proximaOrdem = (maxOrdem?.ordem ?? 0) + 1;

    // Criar novos vínculos (INCREMENTAL - não remove existentes)
    if (novosIds.length > 0) {
      const novosVinculos = novosIds.map((pilarId, index) => ({
        empresaId,
        pilarId,
        ordem: proximaOrdem + index,
        createdBy: user.id,
      }));

      await this.prisma.pilarEmpresa.createMany({
        data: novosVinculos,
      });

      // Buscar IDs dos PilarEmpresa criados (createMany não retorna IDs)
      const pilaresEmpresaCriados = await this.prisma.pilarEmpresa.findMany({
        where: {
          empresaId,
          pilarId: { in: novosIds },
        },
        select: { id: true },
      });

      // Auto-associar rotinas modelo para cada PilarEmpresa criado
      for (const pe of pilaresEmpresaCriados) {
        await this.autoAssociarRotinasModelo(pe.id, user);
      }

      // Auditoria
      const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
      await this.audit.log({
        usuarioId: user.id,
        usuarioNome: userRecord?.nome ?? '',
        usuarioEmail: userRecord?.email ?? '',
        entidade: 'pilares_empresa',
        entidadeId: empresaId,
        acao: 'UPDATE',
        dadosAntes: { pilaresAnteriores: jaVinculados.length },
        dadosDepois: { novosVinculos: novosVinculos.length, pilaresIds: novosIds },
      });
    }

    // Retornar resultado com estatísticas
    const pilaresAtualizados = await this.findByEmpresa(empresaId, user);

    return {
      vinculados: novosIds.length,
      ignorados: idsJaVinculados,
      pilares: pilaresAtualizados,
    };
  }

  /**
   * Auto-associar rotinas modelo a PilarEmpresa recém-criado
   * Implementa R-ROT-BE-001
   * 
   * Chamado após criar novo vínculo PilarEmpresa
   * Busca todas as rotinas com modelo: true do pilar
   * Cria RotinaEmpresa para cada rotina modelo encontrada
   */
  async autoAssociarRotinasModelo(
    pilarEmpresaId: string,
    user: RequestUser,
  ): Promise<void> {
    // Buscar PilarEmpresa com pilar e suas rotinas modelo
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: pilarEmpresaId },
      include: {
        pilar: {
          include: {
            rotinas: {
              where: {
                modelo: true,
                ativo: true,
              },
            },
          },
        },
      },
    });

    if (!pilarEmpresa) {
      throw new NotFoundException('PilarEmpresa não encontrado');
    }

    const rotinasModelo = pilarEmpresa.pilar.rotinas;

    if (rotinasModelo.length === 0) {
      // Sem rotinas modelo para associar
      return;
    }

    // Criar RotinaEmpresa para cada rotina modelo
    const rotinaEmpresaData = rotinasModelo.map((rotina, index) => ({
      pilarEmpresaId: pilarEmpresa.id,
      rotinaId: rotina.id,
      ordem: rotina.ordem ?? (index + 1), // Fallback: usar índice sequencial se ordem null
      createdBy: user.id,
    }));

    await this.prisma.rotinaEmpresa.createMany({
      data: rotinaEmpresaData,
      skipDuplicates: true, // Evita erro se já existir
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
      dadosAntes: null,
      dadosDepois: {
        acao: 'auto_associacao_rotinas_modelo',
        rotinasAssociadas: rotinaEmpresaData.length,
        rotinasIds: rotinasModelo.map(r => r.id),
      },
    });
  }

  /**
   * Remover um pilar de uma empresa (hard delete)
   * Deleta PilarEmpresa e cascatea automaticamente:
   * - RotinaEmpresa (onDelete: Cascade no schema)
   * - NotaRotina (onDelete: Cascade no schema)
   * Implementa validação multi-tenant
   */
  async remover(
    empresaId: string,
    pilarEmpresaId: string,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Buscar PilarEmpresa para validar existência e pertencimento à empresa
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: pilarEmpresaId },
      include: {
        pilar: true,
      },
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

    // Hard delete (cascata automática via Prisma)
    const deleted = await this.prisma.pilarEmpresa.delete({
      where: { id: pilarEmpresaId }
    });

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'pilares_empresa',
      entidadeId: pilarEmpresaId,
      acao: 'DELETE',
      dadosAntes: { pilarNome: pilarEmpresa.pilar.nome, empresaId }
    });

    return {
      message: `Pilar "${pilarEmpresa.pilar.nome}" removido com sucesso`,
      pilarEmpresa: deleted,
    };
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
      include: { pilar: true },
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
        pilar: true,
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
   * Listar rotinas de um pilar da empresa
   */
  async listarRotinas(
    empresaId: string,
    pilarEmpresaId: string,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Validar que o PilarEmpresa pertence à empresa
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: pilarEmpresaId },
    });

    if (!pilarEmpresa || pilarEmpresa.empresaId !== empresaId) {
      throw new NotFoundException('Pilar não encontrado nesta empresa');
    }

    // Buscar rotinas vinculadas
    const rotinas = await this.prisma.rotinaEmpresa.findMany({
      where: { pilarEmpresaId },
      include: {
        rotina: {
          include: {
            pilar: true,
          },
        },
      },
      orderBy: { ordem: 'asc' },
    });

    return rotinas;
  }

  /**
   * Vincular uma rotina a um pilar da empresa
   */
  async vincularRotina(
    empresaId: string,
    pilarEmpresaId: string,
    rotinaId: string,
    ordem: number | undefined,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Validar que o PilarEmpresa pertence à empresa
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: pilarEmpresaId },
      include: { pilar: true },
    });

    if (!pilarEmpresa || pilarEmpresa.empresaId !== empresaId) {
      throw new NotFoundException('Pilar não encontrado nesta empresa');
    }

    // Validar que a rotina existe e pertence ao mesmo pilar
    const rotina = await this.prisma.rotina.findUnique({
      where: { id: rotinaId },
    });

    if (!rotina || !rotina.ativo) {
      throw new NotFoundException('Rotina não encontrada ou inativa');
    }

    if (rotina.pilarId !== pilarEmpresa.pilarId) {
      throw new BadRequestException('A rotina não pertence a este pilar');
    }

    // Verificar se já existe vínculo
    const existente = await this.prisma.rotinaEmpresa.findUnique({
      where: {
        pilarEmpresaId_rotinaId: {
          pilarEmpresaId,
          rotinaId,
        },
      },
    });

    if (existente) {
      throw new BadRequestException('Esta rotina já está vinculada a este pilar');
    }

    // Calcular ordem se não fornecida
    let ordemFinal = ordem;
    if (!ordemFinal) {
      const ultimaRotina = await this.prisma.rotinaEmpresa.findFirst({
        where: { pilarEmpresaId },
        orderBy: { ordem: 'desc' },
        select: { ordem: true },
      });
      ordemFinal = ultimaRotina ? ultimaRotina.ordem + 1 : 1;
    }

    // Criar vínculo
    const rotinaEmpresa = await this.prisma.rotinaEmpresa.create({
      data: {
        pilarEmpresaId,
        rotinaId,
        ordem: ordemFinal,
        createdBy: user.id,
      },
      include: {
        rotina: {
          include: {
            pilar: true,
          },
        },
      },
    });

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'rotinas_empresa',
      entidadeId: rotinaEmpresa.id,
      acao: 'CREATE',
      dadosDepois: { pilarEmpresaId, rotinaId, ordem: ordemFinal },
    });

    return rotinaEmpresa;
  }

  /**
   * Remover uma rotina de um pilar da empresa
   */
  async removerRotina(
    empresaId: string,
    rotinaEmpresaId: string,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Buscar RotinaEmpresa
    const rotinaEmpresa = await this.prisma.rotinaEmpresa.findUnique({
      where: { id: rotinaEmpresaId },
      include: {
        pilarEmpresa: true,
        rotina: true,
      },
    });

    if (!rotinaEmpresa) {
      throw new NotFoundException('Vínculo rotina-pilar não encontrado');
    }

    if (rotinaEmpresa.pilarEmpresa.empresaId !== empresaId) {
      throw new ForbiddenException('Esta rotina não pertence à empresa especificada');
    }

    // Deletar (cascata automática de NotaRotina via schema)
    const deleted = await this.prisma.rotinaEmpresa.delete({
      where: { id: rotinaEmpresaId },
    });

    // Reordenar rotinas restantes
    const rotinasRestantes = await this.prisma.rotinaEmpresa.findMany({
      where: { pilarEmpresaId: rotinaEmpresa.pilarEmpresaId },
      orderBy: { ordem: 'asc' },
    });

    const updates = rotinasRestantes.map((r, index) =>
      this.prisma.rotinaEmpresa.update({
        where: { id: r.id },
        data: { ordem: index + 1, updatedBy: user.id },
      }),
    );

    await this.prisma.$transaction(updates);

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'rotinas_empresa',
      entidadeId: rotinaEmpresaId,
      acao: 'DELETE',
      dadosAntes: { rotinaId: rotinaEmpresa.rotinaId, rotinaNome: rotinaEmpresa.rotina.nome },
    });

    return {
      message: `Rotina "${rotinaEmpresa.rotina.nome}" removida com sucesso`,
      rotinaEmpresa: deleted,
    };
  }

  /**
   * Reordenar rotinas de um pilar da empresa
   */
  async reordenarRotinas(
    empresaId: string,
    pilarEmpresaId: string,
    ordens: Array<{ id: string; ordem: number }>,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Validar que o PilarEmpresa pertence à empresa
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: pilarEmpresaId },
    });

    if (!pilarEmpresa || pilarEmpresa.empresaId !== empresaId) {
      throw new NotFoundException('Pilar não encontrado nesta empresa');
    }

    // Validar que todos os IDs pertencem ao pilarEmpresa
    const idsToUpdate = ordens.map(item => item.id);
    const existingRotinas = await this.prisma.rotinaEmpresa.findMany({
      where: {
        id: { in: idsToUpdate },
        pilarEmpresaId,
      },
      select: { id: true },
    });

    if (existingRotinas.length !== idsToUpdate.length) {
      const foundIds = existingRotinas.map(r => r.id);
      const missingIds = idsToUpdate.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Rotinas não encontradas neste pilar: ${missingIds.join(', ')}`,
      );
    }

    // Atualizar ordens em transação
    const updates = ordens.map((item) =>
      this.prisma.rotinaEmpresa.update({
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
      entidade: 'rotinas_empresa',
      entidadeId: pilarEmpresaId,
      acao: 'UPDATE',
      dadosDepois: { acao: 'reordenar_rotinas', ordens },
    });

    return { message: 'Rotinas reordenadas com sucesso' };
  }
}
