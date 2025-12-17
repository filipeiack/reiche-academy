import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

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

  async findById(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
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
      },
    });
  }

  async create(data: any) {
    const existingUser = await this.findByEmail(data.email);
    
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

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

  async update(id: string, data: any) {
    const before = await this.findById(id);

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

  async remove(id: string) {
    const before = await this.findById(id);
    
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

  async hardDelete(id: string) {
    const usuario = await this.findById(id);

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

  async updateProfilePhoto(id: string, fotoUrl: string) {
    const usuario = await this.findById(id);

    // Remove o arquivo anterior para evitar acúmulo de imagens
    if (usuario.fotoUrl && usuario.fotoUrl !== fotoUrl) {
      const oldFilePath = this.getAbsolutePublicPath(usuario.fotoUrl);
      this.deleteFileIfExists(oldFilePath);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { fotoUrl },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
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
  }

  async deleteProfilePhoto(id: string) {
    const usuario = await this.findById(id);

    // Delete file from filesystem if it exists
    if (usuario.fotoUrl) {
      const filePath = this.getAbsolutePublicPath(usuario.fotoUrl);
      this.deleteFileIfExists(filePath);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { fotoUrl: null },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
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
  }
}
