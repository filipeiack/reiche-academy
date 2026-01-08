import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';
import { AuditService } from '../audit/audit.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);
  
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  /**
   * RA-001: Valida isolamento multi-tenant
   * ADMINISTRADOR tem acesso global
   * Outros perfis só acessam usuários da mesma empresa
   */
  private validateTenantAccess(targetUsuario: { empresaId: string | null }, requestUser: RequestUser, action: string) {
    // ADMINISTRADOR tem acesso global
    if (requestUser.perfil?.codigo === 'ADMINISTRADOR') {
      return;
    }

    // Outros perfis só acessam usuários da mesma empresa
    if (targetUsuario.empresaId !== requestUser.empresaId) {
      throw new ForbiddenException(`Você não pode ${action} usuários de outra empresa`);
    }
  }

  /**
   * RA-004: Valida que usuário não pode criar/editar usuário com perfil superior
   */
  private async validateProfileElevation(targetPerfilId: string, requestUser: RequestUser, action: string) {
    // ADMINISTRADOR pode criar qualquer perfil
    if (requestUser.perfil?.codigo === 'ADMINISTRADOR') {
      return;
    }

    // Buscar perfil alvo
    const targetPerfil = await this.prisma.perfilUsuario.findUnique({
      where: { id: targetPerfilId },
    });

    if (!targetPerfil) {
      throw new NotFoundException('Perfil não encontrado');
    }

    // Verificar se está tentando criar/editar perfil com nível superior (menor número = maior poder)
    if (targetPerfil.nivel <= requestUser.perfil.nivel) {
      throw new ForbiddenException(`Você não pode ${action} usuário com perfil superior ou igual ao seu`);
    }
  }

  /**
   * RA-005: Valida que apenas ADMINISTRADOR pode criar outros ADMINISTRADOR
   */
  private async validateAdminCreation(targetPerfilId: string, requestUser: RequestUser) {
    const targetPerfil = await this.prisma.perfilUsuario.findUnique({
      where: { id: targetPerfilId },
    });

    if (!targetPerfil) {
      throw new NotFoundException('Perfil não encontrado');
    }

    // Se está tentando criar/atribuir perfil ADMINISTRADOR
    if (targetPerfil.codigo === 'ADMINISTRADOR') {
      // Apenas ADMINISTRADOR pode fazer isso
      if (requestUser.perfil?.codigo !== 'ADMINISTRADOR') {
        throw new ForbiddenException('Apenas administradores podem criar ou atribuir perfil ADMINISTRADOR');
      }
    }
  }

  /**
   * RA-006: Valida que ADMINISTRADOR não pode ter empresaId
   */
  private async validateAdminEmpresaRestriction(perfilId: string, empresaId: string | null | undefined) {
    const perfil = await this.prisma.perfilUsuario.findUnique({
      where: { id: perfilId },
    });

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado');
    }

    // Se perfil é ADMINISTRADOR e há empresaId definida
    if (perfil.codigo === 'ADMINISTRADOR' && empresaId) {
      throw new ForbiddenException('Usuários com perfil ADMINISTRADOR não podem ter empresa associada');
    }
  }

  private getAbsolutePublicPath(relativePath: string): string {
    return path.join(process.cwd(), 'public', relativePath.replace(/^[/\\]+/, ''));
  }

  private deleteFileIfExists(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async findAll(requestUser?: RequestUser) {
    // RA-011: ADMINISTRADOR vê todos, outros perfis veem apenas da própria empresa
    const where = requestUser?.perfil?.codigo !== 'ADMINISTRADOR' && requestUser?.empresaId
      ? { empresaId: requestUser.empresaId }
      : {};

    return this.prisma.usuario.findMany({
      where,
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        telefone: true,
        perfil: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            nivel: true,
          },
        },
        fotoUrl: true,
        ativo: true,
        empresaId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findDisponiveis(requestUser?: RequestUser) {
    // RA-011: ADMINISTRADOR vê todos, outros perfis veem apenas da própria empresa
    // Nota: usuários disponíveis sempre têm empresaId: null, então o filtro adicional não é necessário
    // mas mantemos o parâmetro para consistência com outros métodos
    return this.prisma.usuario.findMany({
      where: {
        empresaId: null,
        ativo: true,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        telefone: true,
        perfil: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            nivel: true,
          },
        },
        fotoUrl: true,
        empresaId: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findById(id: string, requestUser: RequestUser, action: string = 'visualizar') {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        telefone: true,
        perfil: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            nivel: true,
          },
        },
        fotoUrl: true,
        ativo: true,
        empresaId: true,
        empresa: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // RA-001: Validar acesso multi-tenant
    this.validateTenantAccess(usuario, requestUser, action);

    return usuario;
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: {
        perfil: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            nivel: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cidade: true,
            estado: true,
            logoUrl: true,
          },
        },
      },
    });
  }

  async create(data: CreateUsuarioDto, requestUser: RequestUser) {
    // Só valida email se ele foi fornecido
    if (data.email) {
      const existingUser = await this.findByEmail(data.email);
      
      if (existingUser) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    // RA-004: Validar elevação de perfil
    await this.validateProfileElevation(data.perfilId, requestUser, 'criar');

    // RA-005: Validar que apenas ADMINISTRADOR pode criar outros ADMINISTRADOR
    await this.validateAdminCreation(data.perfilId, requestUser);

    // RA-006: Validar que ADMINISTRADOR não pode ter empresaId
    await this.validateAdminEmpresaRestriction(data.perfilId, data.empresaId);

    // Forçar empresaId = undefined se perfil for ADMINISTRADOR
    const perfil = await this.prisma.perfilUsuario.findUnique({
      where: { id: data.perfilId },
    });
    
    if (perfil?.codigo === 'ADMINISTRADOR') {
      data.empresaId = undefined;
    }

    // Hash da senha somente se fornecida
    const hashedPassword = data.senha ? await argon2.hash(data.senha) : null;

    const created = await this.prisma.usuario.create({
      data: {
        ...data,
        senha: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        telefone: true,
        perfil: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            nivel: true,
          },
        },
        fotoUrl: true,
        ativo: true,
        empresaId: true,
        createdAt: true,
      },
    });

    await this.audit.log({
      usuarioId: requestUser.id,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'usuarios',
      entidadeId: created.id,
      acao: 'CREATE',
      dadosDepois: { ...created, senha: '[REDACTED]' },
    });

    return created;
  }

  async update(id: string, data: UpdateUsuarioDto, requestUser: RequestUser) {
    const before = await this.findById(id, requestUser);

    // RA-001: Validar isolamento multi-tenant
    this.validateTenantAccess(before, requestUser, 'editar');

    // RA-002: Bloquear auto-edição de campos privilegiados (exceto para ADMINISTRADOR)
    const isSelfEdit = id === requestUser.id;
    const isAdmin = requestUser.perfil.codigo === 'ADMINISTRADOR';
    
    if (isSelfEdit && !isAdmin) {
      const forbiddenFields = ['perfilId', 'empresaId', 'ativo'];
      const attemptingForbidden = forbiddenFields.some(field => (data as any)[field] !== undefined);
      
      if (attemptingForbidden) {
        throw new ForbiddenException('Você não pode alterar perfilId, empresaId ou ativo no seu próprio usuário');
      }
    }

    // RA-004: Validar elevação de perfil se houver mudança de perfilId
    if (data.perfilId && data.perfilId !== before.perfil.id) {
      await this.validateProfileElevation(data.perfilId, requestUser, 'atribuir');
      
      // RA-005: Validar que apenas ADMINISTRADOR pode atribuir perfil ADMINISTRADOR
      await this.validateAdminCreation(data.perfilId, requestUser);
      
      // RA-006: Validar que ADMINISTRADOR não pode ter empresaId
      await this.validateAdminEmpresaRestriction(data.perfilId, data.empresaId ?? before.empresaId);
      
      // Forçar empresaId = undefined se novo perfil for ADMINISTRADOR
      const novoPerfil = await this.prisma.perfilUsuario.findUnique({
        where: { id: data.perfilId },
      });
      
      if (novoPerfil?.codigo === 'ADMINISTRADOR') {
        data.empresaId = undefined;
      }
    }

    // RA-006: Validar empresaId se houver mudança
    if (data.empresaId !== undefined && data.empresaId !== before.empresaId) {
      const perfilId = data.perfilId || before.perfil.id;
      await this.validateAdminEmpresaRestriction(perfilId, data.empresaId);
    }

    // R-USU-030: Validar unicidade de email se houver mudança
    if (data.email && data.email !== before.email) {
      const existingUser = await this.findByEmail(data.email);
      
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email já cadastrado por outro usuário');
      }
    }

    if (data.senha) {
      data.senha = await argon2.hash(data.senha);
    }

    const after = await this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        telefone: true,
        perfil: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            nivel: true,
          },
        },
        fotoUrl: true,
        ativo: true,
        empresaId: true,
        updatedAt: true,
      },
    });

    await this.audit.log({
      usuarioId: after.id,
      usuarioNome: after.nome,
      usuarioEmail: after.email,
      entidade: 'usuarios',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: { ...before, senha: '[REDACTED]' },
      dadosDepois: { ...after, senha: '[REDACTED]' },
    });

    return after;
  }

  async remove(id: string, requestUser: RequestUser) {
    const before = await this.findById(id, requestUser, 'editar');
    
    const after = await this.prisma.usuario.update({
      where: { id },
      data: { ativo: false },
    });

    await this.audit.log({
      usuarioId: after.id,
      usuarioNome: after.nome,
      usuarioEmail: after.email,
      entidade: 'usuarios',
      entidadeId: id,
      acao: 'DELETE',
      dadosAntes: { ...before, senha: '[REDACTED]' },
      dadosDepois: { ...after, senha: '[REDACTED]' },
    });

    return after;
  }

  async hardDelete(id: string, requestUser: RequestUser) {
    const usuario = await this.findById(id, requestUser, 'editar');

    // Delete profile photo if exists
    if (usuario.fotoUrl) {
      const filePath = this.getAbsolutePublicPath(usuario.fotoUrl);
      this.deleteFileIfExists(filePath);
    }

    const result = await this.prisma.usuario.delete({
      where: { id },
    });

    await this.audit.log({
      usuarioId: requestUser.id,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'usuarios',
      entidadeId: id,
      acao: 'DELETE',
      dadosAntes: { ...usuario, senha: '[REDACTED]' },
    });

    return result;
  }

  async updateProfilePhoto(id: string, fotoUrl: string, requestUser: RequestUser) {
    const usuario = await this.findById(id, requestUser);

    // RA-003: Apenas ADMINISTRADOR ou o próprio usuário pode alterar foto
    if (requestUser.perfil?.codigo !== 'ADMINISTRADOR' && requestUser.id !== id) {
      throw new ForbiddenException('Você não pode alterar a foto de outro usuário');
    }

    // RA-001: Validar isolamento multi-tenant
    this.validateTenantAccess(usuario, requestUser, 'alterar foto de');

    // Remove o arquivo anterior para evitar acúmulo de imagens
    if (usuario.fotoUrl && usuario.fotoUrl !== fotoUrl) {
      const oldFilePath = this.getAbsolutePublicPath(usuario.fotoUrl);
      this.deleteFileIfExists(oldFilePath);
    }

    const updated = await this.prisma.usuario.update({
      where: { id },
      data: { fotoUrl },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        telefone: true,
        perfil: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            nivel: true,
          },
        },
        fotoUrl: true,
        ativo: true,
        updatedAt: true,
      },
    });

    // Auditoria de alteração de foto
    await this.audit.log({
      usuarioId: requestUser.id,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'usuarios',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: { fotoUrl: usuario.fotoUrl },
      dadosDepois: { fotoUrl },
    });

    return updated;
  }

  async deleteProfilePhoto(id: string, requestUser: RequestUser) {
    const usuario = await this.findById(id, requestUser);

    // RA-003: Apenas ADMINISTRADOR ou o próprio usuário pode deletar foto
    if (requestUser.perfil?.codigo !== 'ADMINISTRADOR' && requestUser.id !== id) {
      throw new ForbiddenException('Você não pode deletar a foto de outro usuário');
    }

    // RA-001: Validar isolamento multi-tenant
    this.validateTenantAccess(usuario, requestUser, 'deletar foto de');

    // Delete file from filesystem if it exists
    if (usuario.fotoUrl) {
      const filePath = this.getAbsolutePublicPath(usuario.fotoUrl);
      this.deleteFileIfExists(filePath);
    }

    const updated = await this.prisma.usuario.update({
      where: { id },
      data: { fotoUrl: null },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        telefone: true,
        perfil: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            nivel: true,
          },
        },
        fotoUrl: true,
        ativo: true,
        updatedAt: true,
      },
    });

    // Auditoria de remoção de foto
    await this.audit.log({
      usuarioId: requestUser.id,
      usuarioNome: requestUser.nome,
      usuarioEmail: requestUser.email,
      entidade: 'usuarios',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: { fotoUrl: usuario.fotoUrl },
      dadosDepois: { fotoUrl: null },
    });

    return updated;
  }
}
