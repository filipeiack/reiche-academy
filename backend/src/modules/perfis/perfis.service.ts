import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PerfisService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.perfilUsuario.findMany({
      where: { ativo: true },
      orderBy: { nivel: 'asc' },
      select: {
        id: true,
        codigo: true,
        nome: true,
        descricao: true,
        nivel: true,
      },
    });
  }

  async findByCodigo(codigo: string) {
    return this.prisma.perfilUsuario.findUnique({
      where: { codigo },
    });
  }
}
