import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';
import { CreateRotinaEmpresaDto } from '../rotinas/dto/create-rotina-empresa.dto';
import { UpdateRotinaEmpresaDto } from '../rotinas/dto/update-rotina-empresa.dto';

@Injectable()
export class RotinasEmpresaService {
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
      const foundIds = existingRotinas.map((r: any) => r.id);
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
    let criticidade = dto.criticidade ?? null;

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
      criticidade = template.criticidade ?? null;
    } else {
      // Usar dados customizados
      nome = dto.nome!;
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
        pilarEmpresaId,
        ordem: proximaOrdem,
        criticidade,
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
   * Atualizar RotinaEmpresa (nome e/ou observação)
   */
  async updateRotinaEmpresa(
    empresaId: string,
    rotinaEmpresaId: string,
    dto: UpdateRotinaEmpresaDto,
    user: RequestUser,
  ) {
    this.validateTenantAccess(empresaId, user);

    // Buscar rotina para validação
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

    // Se nome fornecido, validar unicidade por pilarEmpresa
    if (dto.nome) {
      const nomeExistente = await this.prisma.rotinaEmpresa.findFirst({
        where: {
          pilarEmpresaId: rotinaEmpresa.pilarEmpresaId,
          nome: dto.nome,
          id: { not: rotinaEmpresaId }, // Excluir o próprio registro
        },
      });

      if (nomeExistente) {
        throw new ConflictException(
          `Já existe uma rotina com o nome "${dto.nome}" neste pilar`,
        );
      }
    }

    // Atualizar rotina
    const updated = await this.prisma.rotinaEmpresa.update({
      where: { id: rotinaEmpresaId },
      data: {
        nome: dto.nome,
        observacao: dto.observacao,
        criticidade: dto.criticidade,
        updatedBy: user.id,
      },
      include: {
        rotinaTemplate: true,
      },
    });

    // Auditoria
    const userRecord = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: userRecord?.nome ?? '',
      usuarioEmail: userRecord?.email ?? '',
      entidade: 'rotinas_empresa',
      entidadeId: rotinaEmpresaId,
      acao: 'UPDATE',
      dadosAntes: {
        nome: rotinaEmpresa.nome,
        observacao: rotinaEmpresa.observacao,
        criticidade: rotinaEmpresa.criticidade,
      },
      dadosDepois: {
        nome: dto.nome ?? rotinaEmpresa.nome,
        observacao: dto.observacao ?? rotinaEmpresa.observacao,
        criticidade: dto.criticidade ?? rotinaEmpresa.criticidade,
      },
    });

    return updated;
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
