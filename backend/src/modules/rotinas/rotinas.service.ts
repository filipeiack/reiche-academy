import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { UpdateRotinaDto } from './dto/update-rotina.dto';

@Injectable()
export class RotinasService {
  constructor(private prisma: PrismaService) {}

  async create(createRotinaDto: CreateRotinaDto, userId: string) {
    // Verifica se o pilar existe
    const pilar = await this.prisma.pilar.findUnique({
      where: { id: createRotinaDto.pilarId },
    });

    if (!pilar) {
      throw new NotFoundException('Pilar não encontrado');
    }

    return this.prisma.rotina.create({
      data: {
        ...createRotinaDto,
        createdBy: userId,
      },
      include: {
        pilar: true,
      },
    });
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
    await this.findOne(id);

    if (updateRotinaDto.pilarId) {
      const pilar = await this.prisma.pilar.findUnique({
        where: { id: updateRotinaDto.pilarId },
      });

      if (!pilar) {
        throw new NotFoundException('Pilar não encontrado');
      }
    }

    return this.prisma.rotina.update({
      where: { id },
      data: {
        ...updateRotinaDto,
        updatedBy: userId,
      },
      include: {
        pilar: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    return this.prisma.rotina.update({
      where: { id },
      data: {
        ativo: false,
        updatedBy: userId,
      },
    });
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

    return this.findAll(pilarId);
  }
}
