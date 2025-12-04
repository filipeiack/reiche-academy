import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        perfil: true,
        ativo: true,
        empresaId: true,
        createdAt: true,
        updatedAt: true,
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
        perfil: true,
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
    });
  }

  async create(data: any) {
    const existingUser = await this.findByEmail(data.email);
    
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await argon2.hash(data.senha);

    return this.prisma.usuario.create({
      data: {
        ...data,
        senha: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        perfil: true,
        ativo: true,
        empresaId: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: any) {
    await this.findById(id);

    if (data.senha) {
      data.senha = await argon2.hash(data.senha);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        nome: true,
        perfil: true,
        ativo: true,
        empresaId: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    
    return this.prisma.usuario.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
