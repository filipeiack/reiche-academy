import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateObjetivoTemplateDto } from './dto/create-objetivo-template.dto';
import { UpdateObjetivoTemplateDto } from './dto/update-objetivo-template.dto';

@Injectable()
export class ObjetivosTemplatesService {
  constructor(private prisma: PrismaService) {}

  private get objetivoTemplate() {
    return (this.prisma as any).objetivoTemplate;
  }

  async create(dto: CreateObjetivoTemplateDto, user: { id: string }) {
    const pilar = await this.prisma.pilar.findUnique({
      where: { id: dto.pilarId },
    });

    if (!pilar) {
      throw new NotFoundException('Pilar não encontrado');
    }

    const existing = await this.objetivoTemplate.findUnique({
      where: { pilarId: dto.pilarId },
    });

    if (existing) {
      throw new ConflictException('Já existe um objetivo template para este pilar');
    }

    return this.objetivoTemplate.create({
      data: {
        pilarId: dto.pilarId,
        entradas: dto.entradas,
        saidas: dto.saidas,
        missao: dto.missao,
        createdBy: user.id,
        updatedBy: user.id,
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
    });
  }

  async findAll(pilarId?: string) {
    return this.objetivoTemplate.findMany({
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
      orderBy: [{ pilar: { ordem: 'asc' } }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const objetivo = await this.objetivoTemplate.findUnique({
      where: { id },
      include: {
        pilar: true,
      },
    });

    if (!objetivo) {
      throw new NotFoundException('Objetivo template não encontrado');
    }

    return objetivo;
  }

  async update(id: string, dto: UpdateObjetivoTemplateDto, userId: string) {
    await this.findOne(id);

    if (dto.pilarId) {
      const pilar = await this.prisma.pilar.findUnique({
        where: { id: dto.pilarId },
      });

      if (!pilar) {
        throw new NotFoundException('Pilar não encontrado');
      }

      const existing = await this.objetivoTemplate.findUnique({
        where: { pilarId: dto.pilarId },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe um objetivo template para este pilar');
      }
    }

    return this.objetivoTemplate.update({
      where: { id },
      data: {
        entradas: dto.entradas,
        saidas: dto.saidas,
        missao: dto.missao,
        pilarId: dto.pilarId,
        updatedBy: userId,
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
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.objetivoTemplate.delete({
      where: { id },
    });
  }
}
