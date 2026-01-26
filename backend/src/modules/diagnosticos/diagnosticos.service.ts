import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';
import { UpdateNotaRotinaDto } from './dto/update-nota-rotina.dto';

@Injectable()
export class DiagnosticosService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Valida acesso multi-tenant
   * ADMINISTRADOR tem acesso global
   * Outros perfis só podem acessar rotinas da sua própria empresa
   */
  private async validateTenantAccess(rotinaEmpresaId: string, user: RequestUser) {
    const rotinaEmpresa = await this.prisma.rotinaEmpresa.findUnique({
      where: { id: rotinaEmpresaId },
      include: {
        pilarEmpresa: {
          select: { empresaId: true },
        },
      },
    });

    if (!rotinaEmpresa) {
      throw new NotFoundException('Rotina não encontrada');
    }

    if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== rotinaEmpresa.pilarEmpresa.empresaId) {
      throw new ForbiddenException('Você não pode acessar dados de outra empresa');
    }

    return rotinaEmpresa.pilarEmpresa.empresaId;
  }

  /**
   * Buscar estrutura completa de diagnóstico de uma empresa
   * Retorna pilares → rotinas → notas
   */
  async getDiagnosticoByEmpresa(empresaId: string, user: RequestUser) {
    // Validar acesso multi-tenant
    if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
      throw new ForbiddenException('Você não pode acessar dados de outra empresa');
    }

    const pilares = await this.prisma.pilarEmpresa.findMany({
      where: {
        empresaId,
        ativo: true,
      },
      include: {
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true,
          },
        },
        cockpit: {
          select: {
            id: true,
            pilarEmpresaId: true,
          },
        },
        rotinasEmpresa: {
          where: {
            ativo: true,
          },
          include: {
            notas: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Pegar apenas a nota mais recente
            },
          },
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: { ordem: 'asc' },
    });

    return pilares;
  }

  /**
   * Atualizar ou criar nota de uma rotina
   * Se já existir nota, atualiza. Senão, cria uma nova.
   */
  async upsertNotaRotina(
    rotinaEmpresaId: string,
    updateDto: UpdateNotaRotinaDto,
    user: RequestUser,
  ) {
    // Validar acesso multi-tenant
    const empresaId = await this.validateTenantAccess(rotinaEmpresaId, user);

    // Buscar nota mais recente (se existir)
    const notaExistente = await this.prisma.notaRotina.findFirst({
      where: { rotinaEmpresaId },
      orderBy: { createdAt: 'desc' },
    });

    let nota;

    if (notaExistente) {
      // Atualizar nota existente
      nota = await this.prisma.notaRotina.update({
        where: { id: notaExistente.id },
        data: {
          nota: updateDto.nota,
          criticidade: updateDto.criticidade,
          updatedBy: user.id,
        },
        include: {
          rotinaEmpresa: {
            select: {
              nome: true,
              pilarEmpresa: {
                select: { nome: true },
              },
            },
          },
        },
      });

      // Registrar auditoria
      await this.audit.log({
        usuarioId: user.id,
        usuarioNome: user.nome || '',
        usuarioEmail: user.email || '',
        entidade: 'NotaRotina',
        entidadeId: nota.id,
        acao: 'UPDATE',
        dadosAntes: {
          nota: notaExistente.nota,
          criticidade: notaExistente.criticidade,
        },
        dadosDepois: {
          nota: updateDto.nota,
          criticidade: updateDto.criticidade,
        },
      });
    } else {
      // Criar nova nota
      nota = await this.prisma.notaRotina.create({
        data: {
          rotinaEmpresaId,
          nota: updateDto.nota,
          criticidade: updateDto.criticidade,
          createdBy: user.id,
          updatedBy: user.id,
        },
        include: {
          rotinaEmpresa: {
            select: {
              nome: true,
              pilarEmpresa: {
                select: { nome: true },
              },
            },
          },
        },
      });

      // Registrar auditoria
      await this.audit.log({
        usuarioId: user.id,
        usuarioNome: user.nome || '',
        usuarioEmail: user.email || '',
        entidade: 'NotaRotina',
        entidadeId: nota.id,
        acao: 'CREATE',
        dadosDepois: {
          nota: updateDto.nota,
          criticidade: updateDto.criticidade,
          rotinaEmpresaId,
        },
      });
    }

    return {
      message: notaExistente ? 'Nota atualizada com sucesso' : 'Nota criada com sucesso',
      nota,
    };
  }

  /**
   * Calcular médias atuais dos pilares de uma empresa
   * Retorna apenas pilares que possuem pelo menos 1 nota
   */
  async calcularMediasPilares(empresaId: string, user: RequestUser) {
    // Validar acesso multi-tenant
    if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
      throw new ForbiddenException('Você não pode acessar dados de outra empresa');
    }

    // Buscar pilares da empresa com suas rotinas e notas
    const pilares = await this.prisma.pilarEmpresa.findMany({
      where: {
        empresaId,
        ativo: true,
      },
      include: {
        rotinasEmpresa: {
          where: {
            ativo: true,
          },
          include: {
            notas: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Apenas a nota mais recente
            },
          },
        },
      },
      orderBy: { ordem: 'asc' },
    });

    // Calcular médias
    const medias = pilares
      .map((pilar: any) => {
        const notasValidas = pilar.rotinasEmpresa
          .map((re: any) => re.notas[0]?.nota)
          .filter((nota: any) => nota !== null && nota !== undefined);

        if (notasValidas.length === 0) {
          return null; // Não retornar pilares sem notas
        }

        const soma = notasValidas.reduce((acc: any, nota: any) => acc + nota, 0);
        const mediaAtual = soma / notasValidas.length;

        // Encontrar a data de atualização mais recente entre todas as notas do pilar
        const datasAtualizacao = pilar.rotinasEmpresa
          .map((re: any) => re.notas[0]?.updatedAt)
          .filter((data: any) => data !== null && data !== undefined);
        
        const ultimaAtualizacao = datasAtualizacao.length > 0
          ? new Date(Math.max(...datasAtualizacao.map((d: any) => new Date(d).getTime())))
          : null;

        return {
          pilarEmpresaId: pilar.id,
          pilarTemplateId: pilar.pilarTemplateId,
          pilarNome: pilar.nome,
          mediaAtual: Number(mediaAtual.toFixed(2)),
          totalRotinasAvaliadas: notasValidas.length,
          totalRotinas: pilar.rotinasEmpresa.length,
          ultimaAtualizacao,
        };
      })
      .filter((media: any) => media !== null);

    return medias;
  }

  /**
   * @deprecated Este método foi substituído pelo sistema de Períodos de Avaliação Trimestral.
   * Use PeriodosAvaliacaoService.congelar() para criar snapshots vinculados a períodos.
   * 
   * Congelar médias atuais na tabela PilarEvolucao
   * Cria snapshots históricos das médias ou atualiza se já existe registro hoje
   */
  async congelarMedias(empresaId: string, user: RequestUser) {
    throw new BadRequestException(
      'Este endpoint está deprecado. Use POST /periodos-avaliacao/:id/congelar para criar snapshots de médias vinculados a períodos trimestrais. Consulte a documentação do novo sistema de períodos.'
    );
  }

  /**
   * Buscar histórico de evolução de um pilar
   * Retorna todos os snapshots ordenados por data
   */
  async buscarHistoricoEvolucao(empresaId: string, pilarEmpresaId: string, user: RequestUser) {
    // Validar se pilarEmpresa pertence à empresa
    const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
      where: { id: pilarEmpresaId },
      select: { empresaId: true },
    });

    if (!pilarEmpresa) {
      throw new NotFoundException('Pilar não encontrado');
    }

    if (pilarEmpresa.empresaId !== empresaId) {
      throw new BadRequestException('Pilar não pertence à empresa informada');
    }

    // Validar acesso multi-tenant
    if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
      throw new ForbiddenException('Você não pode acessar dados de outra empresa');
    }

    // Buscar histórico
    const historico = await this.prisma.pilarEvolucao.findMany({
      where: { pilarEmpresaId },
      orderBy: { createdAt: 'asc' },
      include: {
        pilarEmpresa: {
          select: {
            nome: true,
            pilarTemplateId: true,
          },
        },
      },
    });

    return historico.map((item: any) => ({
      id: item.id,
      mediaNotas: item.mediaNotas,
      createdAt: item.createdAt,
      pilarNome: item.pilarEmpresa.nome,
      pilarTemplateId: item.pilarEmpresa.pilarTemplateId,
    }));
  }
}
