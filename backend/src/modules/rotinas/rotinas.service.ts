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

    // Verifica se já existe rotina com este nome
    const existingRotina = await this.prisma.rotina.findFirst({
      where: { 
        nome: {
          equals: createRotinaDto.nome,
          mode: 'insensitive'
        }
      },
    });

    if (existingRotina) {
      throw new ConflictException('Já existe uma rotina com este nome');
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

    // Verifica se o nome está sendo alterado e se já existe
    if (updateRotinaDto.nome) {
      const existingRotina = await this.prisma.rotina.findFirst({
        where: {
          nome: {
            equals: updateRotinaDto.nome,
            mode: 'insensitive'
          },
          id: { not: id },
        },
      });

      if (existingRotina) {
        throw new ConflictException('Já existe uma rotina com este nome');
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
      // Buscar detalhes das empresas afetadas
      const rotinaEmpresasEmUso = await this.prisma.rotinaEmpresa.findMany({
        where: { rotinaTemplateId: id },
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

      const empresasAfetadas = rotinaEmpresasEmUso.map((re: any) => ({
        id: re.pilarEmpresa.empresa.id,
        nome: re.pilarEmpresa.empresa.nome,
      }));

      // Bloqueio rígido com 409 Conflict + lista de empresas
      throw new ConflictException({
        message: 'Não é possível desativar esta rotina pois está em uso por empresas',
        empresasAfetadas,
        totalEmpresas: empresasAfetadas.length,
      });
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
