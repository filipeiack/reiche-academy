import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { UpdateRotinaDto } from './dto/update-rotina.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RotinasService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(createRotinaDto: CreateRotinaDto, userId: string) {
    // Verifica se o pilar existe
    const pilar = await this.prisma.pilar.findUnique({
      where: { id: createRotinaDto.pilarId },
    });

    if (!pilar) {
      throw new NotFoundException('Pilar não encontrado');
    }

    const created = await this.prisma.rotina.create({
      data: {
        ...createRotinaDto,
        createdBy: userId,
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

    // R-ROT-BE-002: Validar se rotina está em uso por empresas
    const rotinaEmpresasEmUso = await this.prisma.rotinaEmpresa.findMany({
      where: { rotinaId: id },
      include: {
        pilarEmpresa: {
          include: {
            empresa: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    if (rotinaEmpresasEmUso.length > 0) {
      const empresasAfetadas = rotinaEmpresasEmUso.map(
        (re) => ({
          id: re.pilarEmpresa.empresa.id,
          nome: re.pilarEmpresa.empresa.nome,
        })
      );

      // Bloqueio rígido com 409 Conflict + lista de empresas
      throw new ConflictException({
        message: 'Não é possível desativar esta rotina pois está em uso por empresas',
        empresasAfetadas,
        totalEmpresas: empresasAfetadas.length,
      });
    }

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
