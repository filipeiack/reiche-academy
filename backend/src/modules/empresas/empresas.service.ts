import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async create(createEmpresaDto: CreateEmpresaDto, userId: string) {
    const existingEmpresa = await this.prisma.empresa.findUnique({
      where: { cnpj: createEmpresaDto.cnpj },
    });

    if (existingEmpresa) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    return this.prisma.empresa.create({
      data: {
        ...createEmpresaDto,
        createdBy: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.empresa.findMany({
      where: { ativo: true },
      include: {
        _count: {
          select: {
            usuarios: true,
            pilares: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
            ativo: true,
          },
        },
        pilares: {
          include: {
            pilar: true,
          },
        },
        _count: {
          select: {
            usuarios: true,
            pilares: true,
          },
        },
      },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return empresa;
  }

  async findByCnpj(cnpj: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { cnpj },
      select: {
        id: true,
        nome: true,
        razaoSocial: true,
        tipoNegocio: true,
        logoUrl: true,
        loginUrl: true,
        ativo: true,
      },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return empresa;
  }

  async update(id: string, updateEmpresaDto: UpdateEmpresaDto, userId: string) {
    await this.findOne(id);

    if (updateEmpresaDto.cnpj) {
      const existingEmpresa = await this.prisma.empresa.findFirst({
        where: {
          cnpj: updateEmpresaDto.cnpj,
          id: { not: id },
        },
      });

      if (existingEmpresa) {
        throw new ConflictException('CNPJ já cadastrado em outra empresa');
      }
    }

    return this.prisma.empresa.update({
      where: { id },
      data: {
        ...updateEmpresaDto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    return this.prisma.empresa.update({
      where: { id },
      data: {
        ativo: false,
        updatedBy: userId,
      },
    });
  }

  async vincularPilares(empresaId: string, pilaresIds: string[], userId: string) {
    await this.findOne(empresaId);

    // Remove vínculos antigos
    await this.prisma.pilarEmpresa.deleteMany({
      where: { empresaId },
    });

    // Cria novos vínculos
    const vinculos = pilaresIds.map((pilarId) => ({
      empresaId,
      pilarId,
      createdBy: userId,
    }));

    await this.prisma.pilarEmpresa.createMany({
      data: vinculos,
    });

    return this.findOne(empresaId);
  }
}
