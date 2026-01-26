import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PilaresEmpresaService } from '../pilares-empresa/pilares-empresa.service';
import { RotinasEmpresaService } from '../pilares-empresa/rotinas-empresa.service';

@Injectable()
export class EmpresasService {
  constructor(
    private prisma: PrismaService, 
    private audit: AuditService,
    private pilaresEmpresaService: PilaresEmpresaService,
    private rotinasEmpresaService: RotinasEmpresaService,
  ) {}

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

    // RA-EMP-004: Auto-associar templates de pilares e rotinas à nova empresa
    // Configurável via env var AUTO_ASSOCIAR_PILARES_PADRAO (default: true)
    const autoAssociate = process.env.AUTO_ASSOCIAR_PILARES_PADRAO !== 'false';

    if (autoAssociate) {
      // Buscar todos pilares templates ativos
      const pilaresTemplates = await this.prisma.pilar.findMany({
        where: { ativo: true },
        orderBy: { ordem: 'asc' },
        include: {
          rotinas: {
            where: { ativo: true },
            orderBy: { ordem: 'asc' },
          },
        },
      });

      // Para cada pilar template, criar snapshot (PilarEmpresa)
      for (const pilarTemplate of pilaresTemplates) {
        const pilarEmpresa = await this.pilaresEmpresaService.createPilarEmpresa(
          created.id,
          { pilarTemplateId: pilarTemplate.id },
          { id: userId, perfil: { codigo: 'ADMINISTRADOR' } } as RequestUser,
        );

        // Para cada rotina template do pilar, criar snapshot (RotinaEmpresa)
        for (const rotinaTemplate of pilarTemplate.rotinas) {
          await this.rotinasEmpresaService.createRotinaEmpresa(
            created.id,
            pilarEmpresa.id,
            { rotinaTemplateId: rotinaTemplate.id },
            { id: userId, perfil: { codigo: 'ADMINISTRADOR' } } as RequestUser,
          );
        }
      }
    }

    return created;
  }

  async findAll() {
    const empresas = await this.prisma.empresa.findMany({
      where: { ativo: true },
      include: {
        _count: {
          select: {
            usuarios: true,
            pilares: true,
          },
        },
        periodosMentoria: {
          where: { ativo: true },
          take: 1,
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Mapear para incluir periodoMentoriaAtivo
    return empresas.map((empresa: any) => ({
      ...empresa,
      periodoMentoriaAtivo: empresa.periodosMentoria[0] || null,
      periodosMentoria: undefined, // Remover array original
    }));
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
            pilarTemplate: true,
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
      .map((r: any) => r.tipoNegocio)
      .filter((tipo: any): tipo is string => tipo !== null);
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
