import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(createEmpresaDto: CreateEmpresaDto, userId: string) {
    const existingEmpresa = await this.prisma.empresa.findUnique({
      where: { cnpj: createEmpresaDto.cnpj },
    });

    if (existingEmpresa) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    const created = await this.prisma.empresa.create({
      data: {
        ...createEmpresaDto,
        createdBy: userId,
      },
    });

    return created;
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

  async findAllByEmpresa(empresaId: string) {
    return this.prisma.empresa.findMany({
      where: { ativo: true, id: empresaId },
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
        cnpj: true,
        tipoNegocio: true,
        cidade: true,
        estado: true,
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
    const before = await this.findOne(id);

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

    const after = await this.prisma.empresa.update({
      where: { id },
      data: {
        ...updateEmpresaDto,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      usuarioId: userId,
      usuarioNome: before.usuarios?.find(u => u.id === userId)?.nome ?? '',
      usuarioEmail: before.usuarios?.find(u => u.id === userId)?.email ?? '',
      entidade: 'empresas',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async remove(id: string, userId: string) {
    const before = await this.findOne(id);

    const after = await this.prisma.empresa.update({
      where: { id },
      data: {
        ativo: false,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      usuarioId: userId,
      usuarioNome: before.usuarios?.find(u => u.id === userId)?.nome ?? '',
      usuarioEmail: before.usuarios?.find(u => u.id === userId)?.email ?? '',
      entidade: 'empresas',
      entidadeId: id,
      acao: 'DELETE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async vincularPilares(empresaId: string, pilaresIds: string[], userId: string) {
    const before = await this.findOne(empresaId);

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

    const after = await this.findOne(empresaId);

    await this.audit.log({
      usuarioId: userId,
      usuarioNome: after.usuarios?.find(u => u.id === userId)?.nome ?? '',
      usuarioEmail: after.usuarios?.find(u => u.id === userId)?.email ?? '',
      entidade: 'empresas',
      entidadeId: empresaId,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async getTiposNegocioDistinct(): Promise<string[]> {
    const result = await this.prisma.empresa.findMany({
      where: {
        tipoNegocio: {
          not: null,
        },
      },
      select: {
        tipoNegocio: true,
      },
      distinct: ['tipoNegocio'],
      orderBy: {
        tipoNegocio: 'asc',
      },
    });

    return result
      .map(r => r.tipoNegocio)
      .filter((tipo): tipo is string => tipo !== null);
  }

  async updateLogo(id: string, logoUrl: string) {
    const empresa = await this.findOne(id);
    
    const updated = await this.prisma.empresa.update({
      where: { id },
      data: { logoUrl },
    });

    return { logoUrl: updated.logoUrl };
  }

  async deleteLogo(id: string) {
    const empresa = await this.findOne(id);

    const updated = await this.prisma.empresa.update({
      where: { id },
      data: { logoUrl: null },
    });

    return { logoUrl: null };
  }
}
