import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  /**
   * RA-EMP-001: Valida isolamento multi-tenant
   * ADMINISTRADOR tem acesso global
   * GESTOR só pode acessar sua própria empresa
   */
  private validateTenantAccess(targetEmpresa: { id: string }, requestUser: RequestUser, action: string) {
    // ADMINISTRADOR tem acesso global
    if (requestUser.perfil?.codigo === 'ADMINISTRADOR') {
      return;
    }

    // GESTOR só pode acessar sua própria empresa
    if (targetEmpresa.id !== requestUser.empresaId) {
      throw new ForbiddenException(`Você não pode ${action} dados de outra empresa`);
    }
  }

  async create(createEmpresaDto: CreateEmpresaDto, userId: string) {
    const existingEmpresa = await this.prisma.empresa.findUnique({
      where: { cnpj: createEmpresaDto.cnpj },
    });

    if (existingEmpresa) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    // RA-EMP-003: Validar unicidade de loginUrl
    if (createEmpresaDto.loginUrl && createEmpresaDto.loginUrl.trim() !== '') {
      const existingLoginUrl = await this.prisma.empresa.findFirst({
        where: { loginUrl: createEmpresaDto.loginUrl },
      });

      if (existingLoginUrl) {
        throw new ConflictException('loginUrl já está em uso por outra empresa');
      }
    }

    const created = await this.prisma.empresa.create({
      data: {
        ...createEmpresaDto,
        createdBy: userId,
      },
    });

    // Auto-associar pilares padrão (modelo: true) à nova empresa
    const autoAssociate = process.env.AUTO_ASSOCIAR_PILARES_PADRAO !== 'false';
    
    if (autoAssociate) {
      const pilaresModelo = await this.prisma.pilar.findMany({
        where: { 
          modelo: true, 
          ativo: true 
        },
        orderBy: { ordem: 'asc' },
      });
      
      if (pilaresModelo.length > 0) {
        await this.prisma.pilarEmpresa.createMany({
          data: pilaresModelo.map((pilar, index) => ({
            empresaId: created.id,
            pilarId: pilar.id,
            ordem: pilar.ordem ?? (index + 1),
            createdBy: userId,
          })),
        });
      }
    }

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

  async findByLoginUrl(loginUrl: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { 
        loginUrl,
        ativo: true
      },
      select: {
        id: true,
        nome: true,
        logoUrl: true,
        loginUrl: true,
      },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return empresa;
  }

  async update(id: string, updateEmpresaDto: UpdateEmpresaDto, userId: string, requestUser: RequestUser) {
    const before = await this.findOne(id);

    // RA-EMP-001: Validar isolamento multi-tenant
    this.validateTenantAccess(before, requestUser, 'atualizar');

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

    // RA-EMP-003: Validar unicidade de loginUrl
    if (updateEmpresaDto.loginUrl && updateEmpresaDto.loginUrl.trim() !== '') {
      const existingLoginUrl = await this.prisma.empresa.findFirst({
        where: {
          loginUrl: updateEmpresaDto.loginUrl,
          id: { not: id },
        },
      });

      if (existingLoginUrl) {
        throw new ConflictException('loginUrl já está em uso por outra empresa');
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
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'empresas',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async remove(id: string, userId: string, requestUser: RequestUser) {
    const before = await this.findOne(id);

    // RA-EMP-001: Validar isolamento multi-tenant
    this.validateTenantAccess(before, requestUser, 'desativar');

    const after = await this.prisma.empresa.update({
      where: { id },
      data: {
        ativo: false,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      usuarioId: userId,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'empresas',
      entidadeId: id,
      acao: 'DELETE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async vincularPilares(empresaId: string, pilaresIds: string[], userId: string, requestUser: RequestUser) {
    const before = await this.findOne(empresaId);

    // RA-EMP-001: Validar isolamento multi-tenant
    this.validateTenantAccess(before, requestUser, 'vincular pilares em');

    // Remove vínculos antigos
    await this.prisma.pilarEmpresa.deleteMany({
      where: { empresaId },
    });

    // Cria novos vínculos
    const vinculos = pilaresIds.map((pilarId, index) => ({
      empresaId,
      pilarId,
      ordem: index + 1,
      createdBy: userId,
    }));

    await this.prisma.pilarEmpresa.createMany({
      data: vinculos,
    });

    const after = await this.findOne(empresaId);

    await this.audit.log({
      usuarioId: userId,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
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

  async updateLogo(id: string, logoUrl: string, userId: string, requestUser: RequestUser) {
    const before = await this.findOne(id);

    // RA-EMP-001: Validar isolamento multi-tenant
    this.validateTenantAccess(before, requestUser, 'alterar logo de');
    
    const after = await this.prisma.empresa.update({
      where: { id },
      data: { logoUrl, updatedBy: userId },
    });

    await this.audit.log({
      usuarioId: userId,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'empresas',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return { logoUrl: after.logoUrl };
  }

  async deleteLogo(id: string, userId: string, requestUser: RequestUser) {
    const before = await this.findOne(id);

    // RA-EMP-001: Validar isolamento multi-tenant
    this.validateTenantAccess(before, requestUser, 'deletar logo de');

    const after = await this.prisma.empresa.update({
      where: { id },
      data: { logoUrl: null, updatedBy: userId },
    });

    await this.audit.log({
      usuarioId: userId,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'empresas',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return { logoUrl: null };
  }
}
