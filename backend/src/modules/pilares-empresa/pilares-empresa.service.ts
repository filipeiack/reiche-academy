import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    const rotinaEmpresaData = rotinasModelo.map((rotina) => ({
      pilarEmpresaId: pilarEmpresa.id,
      rotinaId: rotina.id,
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
}
