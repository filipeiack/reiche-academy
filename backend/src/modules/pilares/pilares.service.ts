import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePilarDto } from './dto/create-pilar.dto';
import { UpdatePilarDto } from './dto/update-pilar.dto';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PilaresService {
  auditService: any;
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(createPilarDto: CreatePilarDto, requestUser: RequestUser) {
    const existingPilar = await this.prisma.pilar.findUnique({
      where: { nome: createPilarDto.nome },
    });

    if (existingPilar) {
      throw new ConflictException('Já existe um pilar com este nome');
    }

    // GAP-001: Validação de ordem duplicada
    if (createPilarDto.ordem !== undefined && createPilarDto.ordem !== null) {
      const existingOrdem = await this.prisma.pilar.findUnique({
        where: { ordem: createPilarDto.ordem },
      });
      if (existingOrdem) {
        throw new ConflictException('Já existe um pilar com esta ordem');
      }
    }

    const created = await this.prisma.pilar.create({
      data: {
        ...createPilarDto,
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
    const pilar = await this.prisma.pilar.findFirst({
      where: { 
        id,
        ativo: true,
      },
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

  async update(id: string, updatePilarDto: UpdatePilarDto, requestUser: RequestUser) {
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

    // GAP-001: Validação de ordem duplicada
    if (updatePilarDto.ordem !== undefined && updatePilarDto.ordem !== null) {
      const existingOrdem = await this.prisma.pilar.findFirst({
        where: {
          ordem: updatePilarDto.ordem,
          id: { not: id },
        },
      });
      if (existingOrdem) {
        throw new ConflictException('Já existe um pilar com esta ordem');
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
}
