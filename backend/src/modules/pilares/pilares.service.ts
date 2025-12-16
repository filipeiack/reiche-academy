import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePilarDto } from './dto/create-pilar.dto';
import { UpdatePilarDto } from './dto/update-pilar.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PilaresService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(createPilarDto: CreatePilarDto, userId: string) {
    const existingPilar = await this.prisma.pilar.findUnique({
      where: { nome: createPilarDto.nome },
    });

    if (existingPilar) {
      throw new ConflictException('Já existe um pilar com este nome');
    }

    const created = await this.prisma.pilar.create({
      data: {
        ...createPilarDto,
        createdBy: userId,
      },
    });

    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    await this.audit.log({
      usuarioId: userId,
      usuarioNome: user?.nome ?? '',
      usuarioEmail: user?.email ?? '',
      entidade: 'pilares',
      entidadeId: created.id,
      acao: 'CREATE',
      dadosDepois: created,
    });

    return created;
  }

  async findAll() {
    return this.prisma.pilar.findMany({
      where: { ativo: true },
      include: {
        _count: {
          select: {
            rotinas: true,
            empresas: true,
          },
        },
      },
      orderBy: { ordem: 'asc' },
    });
  }

  async findOne(id: string) {
    const pilar = await this.prisma.pilar.findUnique({
      where: { id },
      include: {
        rotinas: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
        },
        empresas: {
          include: {
            empresa: {
              select: {
                id: true,
                nome: true,
                cnpj: true,
              },
            },
          },
        },
      },
    });

    if (!pilar) {
      throw new NotFoundException('Pilar não encontrado');
    }

    return pilar;
  }

  async update(id: string, updatePilarDto: UpdatePilarDto, userId: string) {
    const before = await this.findOne(id);

    if (updatePilarDto.nome) {
      const existingPilar = await this.prisma.pilar.findFirst({
        where: {
          nome: updatePilarDto.nome,
          id: { not: id },
        },
      });

      if (existingPilar) {
        throw new ConflictException('Já existe um pilar com este nome');
      }
    }

    const after = await this.prisma.pilar.update({
      where: { id },
      data: {
        ...updatePilarDto,
        updatedBy: userId,
      },
    });

    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    await this.audit.log({
      usuarioId: userId,
      usuarioNome: user?.nome ?? '',
      usuarioEmail: user?.email ?? '',
      entidade: 'pilares',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async remove(id: string, userId: string) {
    const before = await this.findOne(id);

    // Verifica se há rotinas ativas vinculadas
    const rotiasCount = await this.prisma.rotina.count({
      where: {
        pilarId: id,
        ativo: true,
      },
    });

    if (rotiasCount > 0) {
      throw new ConflictException(
        'Não é possível desativar um pilar que possui rotinas ativas',
      );
    }

    const after = await this.prisma.pilar.update({
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
      entidade: 'pilares',
      entidadeId: id,
      acao: 'DELETE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async reordenar(ordensIds: { id: string; ordem: number }[], userId: string) {
    const updates = ordensIds.map((item) =>
      this.prisma.pilar.update({
        where: { id: item.id },
        data: {
          ordem: item.ordem,
          updatedBy: userId,
        },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findAll();
  }
}
