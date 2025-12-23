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
    if (targetPerfil.nivel < requestUser.perfil.nivel) {
      throw new ForbiddenException(`Você não pode ${action} usuário com perfil superior ao seu`);
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

  async findAll() {
    return this.prisma.usuario.findMany({
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

  async findDisponiveis() {
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

  async findById(id: string, requestUser: RequestUser) {
    const usuario = await this.findByIdInternal(id);

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // RA-001: Validar acesso multi-tenant
    this.validateTenantAccess(usuario, requestUser, 'visualizar');

    return usuario;
  }

  /**
   * Método interno sem validação multi-tenant
   * Usado por auth.service no refresh token
   */
  async findByIdInternal(id: string) {
    return this.prisma.usuario.findUnique({
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
            logoUrl: true,
          },
        },
      },
    });
  }

  async create(data: CreateUsuarioDto, requestUser: RequestUser) {
    const existingUser = await this.findByEmail(data.email);
    
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // RA-004: Validar elevação de perfil
    await this.validateProfileElevation(data.perfilId, requestUser, 'criar');

    const hashedPassword = await argon2.hash(data.senha);

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
      usuarioId: created.id,
      usuarioNome: created.nome,
      usuarioEmail: created.email,
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
    const before = await this.findById(id, requestUser);
    
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
    const usuario = await this.findById(id, requestUser);

    // Delete profile photo if exists
    if (usuario.fotoUrl) {
      const filePath = this.getAbsolutePublicPath(usuario.fotoUrl);
      this.deleteFileIfExists(filePath);
    }

    await this.audit.log({
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      entidade: 'usuarios',
      entidadeId: id,
      acao: 'DELETE',
      dadosAntes: { ...usuario, senha: '[REDACTED]' },
    });

    return this.prisma.usuario.delete({
      where: { id },
    });
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
