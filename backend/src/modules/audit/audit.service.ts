import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail?: string | null;
    entidade: string;
    entidadeId: string;
    acao: 'CREATE' | 'UPDATE' | 'DELETE';
    dadosAntes?: any;
    dadosDepois?: any;
  }) {
    await this.prisma.auditLog.create({
      data: {
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome,
        usuarioEmail: params.usuarioEmail ?? null,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        acao: params.acao,
        dadosAntes: params.dadosAntes ?? null,
        dadosDepois: params.dadosDepois ?? null,
      },
    });
  }
}
