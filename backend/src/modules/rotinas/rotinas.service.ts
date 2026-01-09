import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { UpdateRotinaDto } from './dto/update-rotina.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RotinasService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(createRotinaDto: CreateRotinaDto, user: any) {
    // Verifica se o pilar template existe
    const pilar = await this.prisma.pilar.findUnique({
      where: { id: createRotinaDto.pilarId },
    });

    if (!pilar) {
      throw new NotFoundException('Pilar não encontrado');
    }

    // Se ordem não fornecida, auto-incrementar
    let ordem = createRotinaDto.ordem;
    if (ordem === undefined || ordem === null) {
      const ultimaRotina = await this.prisma.rotina.findFirst({
        where: { pilarId: createRotinaDto.pilarId },
        orderBy: { ordem: 'desc' },
        select: { ordem: true },
      });
      ordem = (ultimaRotina?.ordem ?? 0) + 1;
    }

    const created = await this.prisma.rotina.create({
      data: {
        ...createRotinaDto,
        ordem,
        createdBy: user.id,
      },
      include: {
        pilar: true,
      },
    });

    const usuario = await this.prisma.usuario.findUnique({ where: { id: user.id } });
    await this.audit.log({
      usuarioId: user.id,
      usuarioNome: usuario?.nome ?? '',
      usuarioEmail: usuario?.email ?? '',
      entidade: 'rotinas',
      entidadeId: created.id,
      acao: 'CREATE',
      dadosDepois: created,
    });

    return created;
  }

  async findAll(pilarId?: string) {
    return this.prisma.rotina.findMany({
      where: {
        ativo: true,
        ...(pilarId && { pilarId }),
      },
      include: {
        pilar: {
          select: {
            id: true,
            nome: true,
            ordem: true,
          },
        },
      },
      orderBy: [{ pilar: { ordem: 'asc' } }, { ordem: 'asc' }],
    });
  }

  async findOne(id: string) {
    const rotina = await this.prisma.rotina.findUnique({
      where: { id },
      include: {
        pilar: true,
      },
    });

    if (!rotina) {
      throw new NotFoundException('Rotina não encontrada');
    }

    return rotina;
  }

  async update(id: string, updateRotinaDto: UpdateRotinaDto, userId: string) {
    const before = await this.findOne(id);

    if (updateRotinaDto.pilarId) {
      const pilar = await this.prisma.pilar.findUnique({
        where: { id: updateRotinaDto.pilarId },
      });

      if (!pilar) {
        throw new NotFoundException('Pilar não encontrado');
      }
    }

    const after = await this.prisma.rotina.update({
      where: { id },
      data: {
        ...updateRotinaDto,
        updatedBy: userId,
      },
      include: {
        pilar: true,
      },
    });

    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    await this.audit.log({
      usuarioId: userId,
      usuarioNome: user?.nome ?? '',
      usuarioEmail: user?.email ?? '',
      entidade: 'rotinas',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async remove(id: string, userId: string) {
    const before = await this.findOne(id);

    // Verificar se há empresas usando a rotina
    const empresasCount = await this.prisma.rotinaEmpresa.count({
      where: { rotinaTemplateId: id },
    });

    if (empresasCount > 0) {
      // Se houver empresas usando, apenas desativa (soft delete)
      const after = await this.prisma.rotina.update({
        where: { id },
        data: {
          ativo: false,
          updatedBy: userId,
        },
      });

      const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
      await this.audit.log({
        usuarioId: userId,
        usuarioNome: user?.nome ?? '',
        usuarioEmail: user?.email ?? '',
        entidade: 'rotinas',
        entidadeId: id,
        acao: 'DELETE',
        dadosAntes: before,
        dadosDepois: after,
      });

      return after;
    }

    // Se não houver empresas, excluir permanentemente
    const deleted = await this.prisma.rotina.delete({
      where: { id },
    });

    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    await this.audit.log({
      usuarioId: userId,
      usuarioNome: user?.nome ?? '',
      usuarioEmail: user?.email ?? '',
      entidade: 'rotinas',
      entidadeId: id,
      acao: 'DELETE',
      dadosAntes: before,
    });

    return deleted;
  }

  async reordenarPorPilar(
    pilarId: string,
    ordensIds: { id: string; ordem: number }[],
    userId: string,
  ) {
    const updates = ordensIds.map((item) =>
      this.prisma.rotina.update({
        where: { id: item.id, pilarId },
        data: {
          ordem: item.ordem,
          updatedBy: userId,
        },
      }),
    );

    await this.prisma.$transaction(updates);

    // Auditoria
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    await this.audit.log({
      usuarioId: userId,
      usuarioNome: user?.nome ?? '',
      usuarioEmail: user?.email ?? '',
      entidade: 'rotinas',
      entidadeId: pilarId,
      acao: 'UPDATE',
      dadosAntes: null,
      dadosDepois: { acao: 'reordenacao', ordens: ordensIds },
    });

    return this.findAll(pilarId);
  }
}
