import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { nowInSaoPaulo } from '../../common/utils/timezone';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  private normalizeEntity(entidade: string): string {
    const map: Record<string, string> = {
      Usuario: 'usuarios',
      PeriodoAvaliacao: 'periodos_avaliacao',
      NotaRotina: 'nota_rotinas',
      CockpitPilar: 'cockpits_pilares',
      IndicadorCockpit: 'indicadores_cockpit',
      IndicadorMensal: 'indicadores_mensais',
      CargoCockpit: 'cargos_cockpit',
      FuncaoCargo: 'funcoes_cargo',
      AcaoCockpit: 'acoes_cockpit',
      ProcessoPrioritario: 'processos_prioritarios',
      ProcessoFluxograma: 'processos_fluxograma',
    };

    return map[entidade] ?? entidade;
  }

  async log(params: {
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail?: string | null;
    entidade: string;
    entidadeId: string;
    acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'CROSS_TENANT_ACCESS';
    dadosAntes?: any;
    dadosDepois?: any;
  }) {
    const entidade = this.normalizeEntity(params.entidade);

    await this.prisma.auditLog.create({
      data: {
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome,
        usuarioEmail: params.usuarioEmail ?? null,
        entidade,
        entidadeId: params.entidadeId,
        acao: params.acao,
        dadosAntes: params.dadosAntes ?? null,
        dadosDepois: params.dadosDepois ?? null,
        createdAt: nowInSaoPaulo(),
      },
    });
  }
}
