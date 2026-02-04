import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateIndicadorTemplateDto } from './dto/create-indicador-template.dto';
import { UpdateIndicadorTemplateDto } from './dto/update-indicador-template.dto';

@Injectable()
export class IndicadoresTemplatesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private get indicadorTemplate() {
    return (this.prisma as any).indicadorTemplate;
  }

  async create(dto: CreateIndicadorTemplateDto, user: { id: string }) {
    const pilar = await this.prisma.pilar.findUnique({
      where: { id: dto.pilarId },
    });

    if (!pilar) {
      throw new NotFoundException('Pilar não encontrado');
    }

    const existing = await this.indicadorTemplate.findFirst({
      where: {
        pilarId: dto.pilarId,
        nome: {
          equals: dto.nome,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException('Já existe um indicador template com este nome neste pilar');
    }

    let ordem = dto.ordem;
    if (ordem === undefined || ordem === null) {
      const ultimo = await this.indicadorTemplate.findFirst({
        where: { pilarId: dto.pilarId },
        orderBy: { ordem: 'desc' },
        select: { ordem: true },
      });
      ordem = (ultimo?.ordem ?? 0) + 1;
    }

    const created = await this.indicadorTemplate.create({
      data: {
        ...dto,
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
      entidade: 'indicadores_templates',
      entidadeId: created.id,
      acao: 'CREATE',
      dadosDepois: created,
    });

    return created;
  }

  async findAll(pilarId?: string) {
    return this.indicadorTemplate.findMany({
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
    const indicador = await this.indicadorTemplate.findUnique({
      where: { id },
      include: {
        pilar: true,
      },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador template não encontrado');
    }

    return indicador;
  }

  async update(id: string, dto: UpdateIndicadorTemplateDto, userId: string) {
    const before = await this.findOne(id);

    if (dto.pilarId) {
      const pilar = await this.prisma.pilar.findUnique({
        where: { id: dto.pilarId },
      });

      if (!pilar) {
        throw new NotFoundException('Pilar não encontrado');
      }
    }

    if (dto.nome || dto.pilarId) {
      const nomeParaValidar = dto.nome ?? before.nome;
      const pilarIdParaValidar = dto.pilarId ?? before.pilarId;

      const existing = await this.indicadorTemplate.findFirst({
        where: {
          pilarId: pilarIdParaValidar,
          nome: {
            equals: nomeParaValidar,
            mode: 'insensitive',
          },
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Já existe um indicador template com este nome neste pilar');
      }
    }

    const after = await this.indicadorTemplate.update({
      where: { id },
      data: {
        ...dto,
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
      entidade: 'indicadores_templates',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async remove(id: string, userId: string) {
    const before = await this.findOne(id);

    const after = await this.indicadorTemplate.update({
      where: { id },
      data: {
        ativo: false,
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
      entidade: 'indicadores_templates',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }
}
