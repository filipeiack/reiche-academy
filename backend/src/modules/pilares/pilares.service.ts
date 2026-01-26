import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePilarDto } from './dto/create-pilar.dto';
import { UpdatePilarDto } from './dto/update-pilar.dto';
import { ReordenarPilarDto } from './dto/reordenar-pilar.dto';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PilaresService {
  auditService: any;
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(createPilarDto: CreatePilarDto, requestUser: RequestUser) {
    const existingPilar = await this.prisma.pilar.findFirst({
      where: { 
        nome: {
          equals: createPilarDto.nome,
          mode: 'insensitive'
        }
      },
    });

    if (existingPilar) {
      throw new ConflictException('Já existe um pilar com este nome');
    }

    // Se ordem não fornecida, auto-incrementar
    let ordem = createPilarDto.ordem;
    if (ordem === undefined || ordem === null) {
      const ultimoPilar = await this.prisma.pilar.findFirst({
        orderBy: { ordem: 'desc' },
        select: { ordem: true },
      });
      ordem = ultimoPilar ? ultimoPilar.ordem + 1 : 1;
    }

    const created = await this.prisma.pilar.create({
      data: {
        ...createPilarDto,
        ordem: ordem as number,
        createdBy: requestUser.id,
      },
    });

    await this.audit.log({
      usuarioId: requestUser.id,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'pilares',
      entidadeId: created.id,
      acao: 'CREATE',
      dadosDepois: created,
    });

    return created;
  }

  async findAll() {
    return this.prisma.pilar.findMany({
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
    const pilar = await this.prisma.pilar.findFirst({
      where: { 
        id,
      },
      include: {
        rotinas: {
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
        _count: {
          select: {
            rotinas: true,
            empresas: true,
          },
        },
      },
    });

    if (!pilar) {
      throw new NotFoundException('Pilar não encontrado');
    }

    return pilar;
  }

  async update(id: string, updatePilarDto: UpdatePilarDto, requestUser: RequestUser) {
    const before = await this.findOne(id);

    if (updatePilarDto.nome) {
      const existingPilar = await this.prisma.pilar.findFirst({
        where: {
          nome: {
            equals: updatePilarDto.nome,
            mode: 'insensitive'
          },
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
        updatedBy: requestUser.id,
      },
    });

    await this.audit.log({
      usuarioId: requestUser.id,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'pilares',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async remove(id: string, requestUser: RequestUser) {
    const before = await this.findOne(id);

    // RA-PIL-001: Verificar se há rotinas ativas vinculadas
    const rotinasAtivasCount = await this.prisma.rotina.count({
      where: {
        pilarId: id,
        ativo: true,
      },
    });

    if (rotinasAtivasCount > 0) {
      throw new ConflictException(
        'Não é possível desativar um pilar que possui rotinas ativas',
      );
    }

    // Verifica se há empresas usando o pilar
    const empresasCount = await this.prisma.pilarEmpresa.count({
      where: {
        pilarTemplateId: id,
      },
    });

    if (empresasCount > 0) {
      // Se houver empresas usando, apenas desativa (soft delete)
      const after = await this.prisma.pilar.update({
        where: { id },
        data: {
          ativo: false,
          updatedBy: requestUser.id,
        },
      });

      await this.audit.log({
        usuarioId: requestUser.id,
        usuarioNome: requestUser.nome,
        usuarioEmail: requestUser.email,
        entidade: 'pilares',
        entidadeId: id,
        acao: 'DELETE',
        dadosAntes: before,
        dadosDepois: after,
      });

      return after;
    }

    // Se não houver empresas, excluir permanentemente (com cascata de rotinas)
    // Primeiro deletar todas as rotinas vinculadas
    await this.prisma.rotina.deleteMany({
      where: {
        pilarId: id,
      },
    });

    // Depois deletar o pilar
    const deleted = await this.prisma.pilar.delete({
      where: { id },
    });

    await this.audit.log({
      usuarioId: requestUser.id,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'pilares',
      entidadeId: id,
      acao: 'DELETE',
      dadosAntes: before,
    });

    return deleted;
  }

  async reordenar(reordenarPilarDto: ReordenarPilarDto, requestUser: RequestUser) {
    const { ordens } = reordenarPilarDto;

    // Atualizar todas as ordens em uma transação
    const updates = ordens.map((item) =>
      this.prisma.pilar.update({
        where: { id: item.id },
        data: { 
          ordem: item.ordem,
          updatedBy: requestUser.id
        },
      }),
    );

    const pilares = await this.prisma.$transaction(updates);

    await this.audit.log({
      usuarioId: requestUser.id,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'pilares',
      entidadeId: 'bulk',
      acao: 'UPDATE',
      dadosDepois: { ordens },
    });

    return pilares;
  }
}
