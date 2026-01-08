import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';
import { CreatePilarEmpresaDto } from './dto/create-pilar-empresa.dto';
import { UpdatePilarEmpresaDto } from './dto/update-pilar-empresa.dto';
import { CreateRotinaEmpresaDto } from '../rotinas/dto/create-rotina-empresa.dto';

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
        pilarTemplate: { ativo: true }, // Filtro de cascata lógica
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
      orderBy: { ordem: 'asc' },
    });

    return rotinas;
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
    let descricao: string | null;

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
      descricao = template.descricao;
    } else {
      // Usar dados customizados (nome obrigatório via DTO validation)
      nome = dto.nome!;
      descricao = dto.descricao ?? null;
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
        descricao,
        empresaId,
        ordem: proximaOrdem,
        createdBy: user.id,
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
   * R-PILEMP-006: Deleção com validação de rotinas
   * Hard delete com cascade audit
   */
  async deletePilarEmpresa(
    empresaId: string,
    pilarEmpresaId: string,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Buscar pilar com contagem de rotinas
    const pilarEmpresa = await this.prisma.pilarEmpresa.findFirst({
      where: {
        id: pilarEmpresaId,
        empresaId,
      },
      include: {
        _count: {
          select: { rotinasEmpresa: true },
        },
      },
    });

    if (!pilarEmpresa) {
      throw new NotFoundException('Pilar não encontrado nesta empresa');
    }

    // Validar ausência de rotinas
    if (pilarEmpresa._count.rotinasEmpresa > 0) {
      throw new ConflictException(
        `Não é possível remover pilar com ${pilarEmpresa._count.rotinasEmpresa} rotina(s) vinculada(s)`,
      );
    }

    // Buscar rotinas para auditoria (caso existam, apesar da validação)
    const rotinasVinculadas = await this.prisma.rotinaEmpresa.findMany({
      where: { pilarEmpresaId },
      select: { id: true, nome: true },
    });

    // Hard delete (Prisma cascade vai deletar rotinas automaticamente)
    await this.prisma.pilarEmpresa.delete({
      where: { id: pilarEmpresaId },
    });

    // Auditoria do pilar deletado
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
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
      },
      dadosDepois: null,
    });

    // Auditoria de rotinas deletadas em cascata
    for (const rotina of rotinasVinculadas) {
      await this.audit.log({
        usuarioId: user.id,
        usuarioNome: userRecord?.nome ?? '',
        usuarioEmail: userRecord?.email ?? '',
        entidade: 'rotinas_empresa',
        entidadeId: rotina.id,
        acao: 'DELETE',
        dadosAntes: { id: rotina.id, nome: rotina.nome, pilarEmpresaId },
        dadosDepois: null,
      });
    }

    return { message: 'Pilar removido com sucesso' };
  }

  /**
   * R-ROTEMP-001: Criar RotinaEmpresa snapshot
   * XOR: rotinaTemplateId OU nome
   */
  async createRotinaEmpresa(
    empresaId: string,
    pilarEmpresaId: string,
    dto: CreateRotinaEmpresaDto,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Validar PilarEmpresa pertence à empresa
    const pilarEmpresa = await this.prisma.pilarEmpresa.findFirst({
      where: {
        id: pilarEmpresaId,
        empresaId,
      },
    });

    if (!pilarEmpresa) {
      throw new NotFoundException('Pilar não encontrado nesta empresa');
    }

    let nome: string;
    let descricao: string | null;

    // XOR validation
    if (dto.rotinaTemplateId) {
      // Copiar dados do template
      const template = await this.prisma.rotina.findUnique({
        where: { id: dto.rotinaTemplateId },
      });

      if (!template) {
        throw new NotFoundException('Template de rotina não encontrado');
      }

      nome = template.nome;
      descricao = template.descricao;
    } else {
      // Usar dados customizados
      nome = dto.nome!;
      descricao = dto.descricao ?? null;
    }

    // Validar nome único no pilar
    const existing = await this.prisma.rotinaEmpresa.findFirst({
      where: {
        pilarEmpresaId,
        nome,
      },
    });

    if (existing) {
      throw new ConflictException('Já existe uma rotina com este nome neste pilar');
    }

    // Calcular ordem (auto-increment)
    const ultimaRotina = await this.prisma.rotinaEmpresa.findFirst({
      where: { pilarEmpresaId },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });

    const proximaOrdem = ultimaRotina ? ultimaRotina.ordem + 1 : 1;

    // Criar snapshot
    const rotinaEmpresa = await this.prisma.rotinaEmpresa.create({
      data: {
        rotinaTemplateId: dto.rotinaTemplateId ?? null,
        nome,
        descricao,
        pilarEmpresaId,
        ordem: proximaOrdem,
        createdBy: user.id,
      },
      include: {
        rotinaTemplate: true,
        pilarEmpresa: { include: { empresa: true } },
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
      dadosAntes: null,
      dadosDepois: {
        ...rotinaEmpresa,
        isCustom: !dto.rotinaTemplateId,
      },
    });

    return rotinaEmpresa;
  }

  /**
   * R-ROTEMP-004: Deletar RotinaEmpresa
   * Hard delete com auditoria
   */
  async deleteRotinaEmpresa(
    empresaId: string,
    rotinaEmpresaId: string,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Buscar rotina para validação e auditoria
    const rotinaEmpresa = await this.prisma.rotinaEmpresa.findFirst({
      where: {
        id: rotinaEmpresaId,
        pilarEmpresa: { empresaId },
      },
      include: {
        pilarEmpresa: { select: { empresaId: true, nome: true } },
      },
    });

    if (!rotinaEmpresa) {
      throw new NotFoundException('Rotina não encontrada nesta empresa');
    }

    // Hard delete
    await this.prisma.rotinaEmpresa.delete({
      where: { id: rotinaEmpresaId },
    });

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'rotinas_empresa',
      entidadeId: rotinaEmpresaId,
      acao: 'DELETE',
      dadosAntes: {
        id: rotinaEmpresa.id,
        nome: rotinaEmpresa.nome,
        pilarEmpresaId: rotinaEmpresa.pilarEmpresaId,
        rotinaTemplateId: rotinaEmpresa.rotinaTemplateId,
      },
      dadosDepois: null,
    });

    return { message: 'Rotina removida com sucesso' };
  }
}
