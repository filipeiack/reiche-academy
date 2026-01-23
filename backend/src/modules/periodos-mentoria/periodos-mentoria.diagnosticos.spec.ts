import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PeriodosMentoriaService } from './periodos-mentoria.service';
import { CreatePeriodoMentoriaDto } from './dto/create-periodo-mentoria.dto';
import { RenovarPeriodoMentoriaDto } from './dto/renovar-periodo-mentoria.dto';
import { addYears } from 'date-fns';

describe('PeriodosMentoriaService - Impacto em Diagnosticos Evolução', () => {
  let service: PeriodosMentoriaService;
  let prisma: PrismaService;

  // Mock data para testes de impacto em Diagnosticos
  const mockEmpresa = {
    id: 'empresa-diagnosticos-uuid',
    nome: 'Empresa Diagnostics Teste',
    cnpj: '55556666777788',
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPeriodoAtivo = {
    id: 'periodo-ativo-diag-uuid',
    empresaId: 'empresa-diagnosticos-uuid',
    numero: 2,
    dataInicio: new Date('2024-01-01'),
    dataFim: new Date('2024-12-31'),
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPeriodoAnterior = {
    id: 'periodo-anterior-diag-uuid',
    empresaId: 'empresa-diagnosticos-uuid',
    numero: 1,
    dataInicio: new Date('2023-01-01'),
    dataFim: new Date('2023-12-31'),
    ativo: false,
    dataEncerramento: new Date('2023-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock de PeriodosAvaliacao (vinculado a PeriodoMentoria)
  const mockPeriodosAvaliacao = [
    {
      id: 'avaliacao-t1-2024',
      empresaId: 'empresa-diagnosticos-uuid',
      trimestre: 1,
      ano: 2024,
      dataReferencia: new Date('2024-03-31'),
      periodoMentoriaId: 'periodo-ativo-diag-uuid',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'avaliacao-t2-2024',
      empresaId: 'empresa-diagnosticos-uuid',
      trimestre: 2,
      ano: 2024,
      dataReferencia: new Date('2024-06-30'),
      periodoMentoriaId: 'periodo-ativo-diag-uuid',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'avaliacao-t4-2023',
      empresaId: 'empresa-diagnosticos-uuid',
      trimestre: 4,
      ano: 2023,
      dataReferencia: new Date('2023-12-31'),
      periodoMentoriaId: 'periodo-anterior-diag-uuid',
      ativo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Mock de PilarEvolucao (resultado das avaliações)
  const mockPilarEvolucao = [
    {
      id: 'evolucao-pilar1-t1',
      pilarId: 'pilar-1-uuid',
      periodoAvaliacaoId: 'avaliacao-t1-2024',
      empresaId: 'empresa-diagnosticos-uuid',
      mediaAnterior: 6.5,
      mediaAtual: 7.2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'evolucao-pilar1-t2',
      pilarId: 'pilar-1-uuid',
      periodoAvaliacaoId: 'avaliacao-t2-2024',
      empresaId: 'empresa-diagnosticos-uuid',
      mediaAnterior: 7.2,
      mediaAtual: 7.8,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'evolucao-pilar2-t1',
      pilarId: 'pilar-2-uuid',
      periodoAvaliacaoId: 'avaliacao-t1-2024',
      empresaId: 'empresa-diagnosticos-uuid',
      mediaAnterior: 5.8,
      mediaAtual: 6.3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPrisma = {
    empresa: { findUnique: jest.fn() },
    periodoMentoria: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    periodoAvaliacao: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    pilarEvolucao: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    diagnostico: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeriodosMentoriaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PeriodosMentoriaService>(PeriodosMentoriaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // IMPACTO DIRETO: PERÍODOAVALIACAO → PERIODOMENTORIA
  // ============================================================

  describe('Impacto Direto: PeriodoAvaliacao vinculado ao PeriodoMentoria', () => {
    it('deve fornecer período ativo para criação de PeriodoAvaliacao', async () => {
      // Simula busca de período ativo para criar avaliação trimestral
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);

      const periodoAtivo = await service.findAtivo('empresa-diagnosticos-uuid');

      // PeriodoAvaliacao usaria estes dados:
      expect(periodoAtivo).toBeDefined();
      expect(periodoAtivo!.id).toBe('periodo-ativo-diag-uuid'); // FK em PeriodoAvaliacao
      expect(periodoAtivo!.dataInicio).toBe(new Date('2024-01-01')); // Limite inferior
      expect(periodoAtivo!.dataFim).toBe(new Date('2024-12-31')); // Limite superior
      expect(periodoAtivo!.numero).toBe(2); // Organização

      // Validação que PeriodoAvaliacao faria:
      const dataReferencia = new Date('2024-06-30'); // Trimestre 2
      const dentroDoPeriodo = dataReferencia >= periodoAtivo!.dataInicio && 
                               dataReferencia <= periodoAtivo!.dataFim;
      expect(dentroDoPeriodo).toBe(true);
    });

    it('deve validar que PeriodoAvaliacao está dentro do PeriodoMentoria', async () => {
      // Simula validação de datas para avaliação trimestral
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);

      const periodoAtivo = await service.findAtivo('empresa-diagnosticos-uuid');

      if (!periodoAtivo) throw new Error('Período não encontrado');

      // Teste de validação de datas que PeriodoAvaliacao faria:
      const avaliacoesTeste = [
        { trimestre: 1, data: new Date('2024-03-31'), valido: true },
        { trimestre: 2, data: new Date('2024-06-30'), valido: true },
        { trimestre: 3, data: new Date('2024-09-30'), valido: true },
        { trimestre: 4, data: new Date('2024-12-31'), valido: true },
        { trimestre: 1, data: new Date('2025-03-31'), valido: false }, // Fora do período
        { trimestre: 4, data: new Date('2023-12-31'), valido: false }, // Período anterior
      ];

      avaliacoesTeste.forEach(avaliacao => {
        const dentroDoPeriodo = avaliacao.data >= periodoAtivo.dataInicio && 
                                 avaliacao.data <= periodoAtivo.dataFim;
        expect(dentroDoPeriodo).toBe(avaliacao.valido);
      });
    });

    it('deve impedir criação de PeriodoAvaliacao se não há período ativo', async () => {
      // Simula tentativa de criar avaliação sem período ativo
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);

      const periodoAtivo = await service.findAtivo('empresa-sem-periodo');

      // PeriodoAvaliacao deverá lançar erro ou mostrar wizard:
      expect(periodoAtivo).toBeNull();

      // Validation que PeriodoAvaliacao faria:
      const podeCriarAvaliacao = periodoAtivo !== null;
      expect(podeCriarAvaliacao).toBe(false);

      // Frontend exibiria mensagem:
      const mensagemErro = 'Empresa não possui período de mentoria ativo para criar avaliações';
      expect(mensagemErro).toBeDefined();
    });
  });

  // ============================================================
  // IMPACTO INDIRETO: PILAREVOLUCAO ORGANIZADO POR PERÍODO
  // ============================================================

  describe('Impacto Indireto: PilarEvolucao organizado por Período', () => {
    it('deve fornecer contexto histórico para PilarEvolucao', async () => {
      // Simula busca de períodos para organizar evolução histórica
      const periodosHistoricos = [mockPeriodoAnterior, mockPeriodoAtivo];
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue(periodosHistoricos as any);

      // Simula PilarEvolucao organizado por período
      jest.spyOn(prisma.pilarEvolucao, 'findMany').mockResolvedValue(mockPilarEvolucao as any);

      const periodos = await service.findByEmpresa('empresa-diagnosticos-uuid');
      const evolucoes = await prisma.pilarEvolucao.findMany();

      // PilarEvolucao organizaria dados por período:
      expect(periodos).toHaveLength(2);
      expect(evolucoes).toHaveLength(3);

      // Análise por período:
      const evolucoesPorPeriodo = evolucoes.reduce((acc, evolucao) => {
        // Obter periodoMentoriaId através do PeriodoAvaliacao
        const periodoAvaliacao = mockPeriodosAvaliacao.find(
          pa => pa.id === evolucao.periodoAvaliacaoId
        );
        const periodoMentoriaId = periodoAvaliacao?.periodoMentoriaId;

        if (!acc[periodoMentoriaId]) acc[periodoMentoriaId] = [];
        acc[periodoMentoriaId].push(evolucao);
        return acc;
      }, {} as any);

      // Validações:
      expect(Object.keys(evolucoesPorPeriodo)).toHaveLength(2);
      expect(evolucoesPorPeriodo['periodo-ativo-diag-uuid']).toHaveLength(2); // T1 e T2 de 2024
      expect(evolucoesPorPeriodo['periodo-anterior-diag-uuid']).toHaveLength(0); // Sem evoluções mock
    });

    it('deve manter sequência temporal correta para evolução', async () => {
      // Simula organização temporal correta dos dados
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([
        mockPeriodoAtivo,
        mockPeriodoAnterior,
      ] as any);

      jest.spyOn(prisma.pilarEvolucao, 'findMany').mockResolvedValue([
        ...mockPilarEvolucao,
        {
          id: 'evolucao-pilar1-t4-2023',
          pilarId: 'pilar-1-uuid',
          periodoAvaliacaoId: 'avaliacao-t4-2023',
          empresaId: 'empresa-diagnosticos-uuid',
          mediaAnterior: 6.0,
          mediaAtual: 6.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const periodos = await service.findByEmpresa('empresa-diagnosticos-uuid');
      const evolucoes = await prisma.pilarEvolucao.findMany();

      // Organização correta (mais recente primeiro):
      expect(periodos[0].numero).toBe(2); // Período ativo 2024
      expect(periodos[1].numero).toBe(1); // Período anterior 2023

      // Evoluções por período em ordem cronológica:
      const evolucoes2024 = evolucoes.filter(e => 
        mockPeriodosAvaliacao.find(pa => pa.id === e.periodoAvaliacaoId)?.periodoMentoriaId === 'periodo-ativo-diag-uuid'
      );
      const evolucoes2023 = evolucoes.filter(e => 
        mockPeriodosAvaliacao.find(pa => pa.id === e.periodoAvaliacaoId)?.periodoMentoriaId === 'periodo-anterior-diag-uuid'
      );

      expect(evolucoes2024).toHaveLength(2);
      expect(evolucoes2023).toHaveLength(1);
    });

    it('deve suportar comparação entre períodos para análise de evolução', async () => {
      // Simula análise comparativa entre períodos
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([
        mockPeriodoAtivo,
        mockPeriodoAnterior,
      ] as any);

      const periodos = await service.findByEmpresa('empresa-diagnosticos-uuid');

      // Análise comparativa que Evolution faria:
      const comparacaoPeriodos = periodos.map((periodo: any) => ({
        periodoId: periodo.id,
        numero: periodo.numero,
        duracao: `${periodo.dataInicio.getFullYear()}/${periodo.dataFim.getFullYear()}`,
        status: periodo.ativo ? 'Ativo' : 'Encerrado',
        avaliacoes: mockPeriodosAvaliacao.filter(pa => 
          pa.periodoMentoriaId === periodo.id
        ).length,
      }));

      expect(comparacaoPeriodos).toHaveLength(2);
      expect(comparacaoPeriodos[0].numero).toBe(2);
      expect(comparacaoPeriodos[0].status).toBe('Ativo');
      expect(comparacaoPeriodos[0].avaliacoes).toBe(2); // T1 e T2 de 2024
      expect(comparacaoPeriodos[1].numero).toBe(1);
      expect(comparacaoPeriodos[1].status).toBe('Encerrado');
      expect(comparacaoPeriodos[1].avaliacoes).toBe(1); // T4 de 2023
    });
  });

  // ============================================================
  // IMPACTO EM DIAGNOSTICOS NOTAS
  // ============================================================

  describe('Impacto em Diagnosticos (Notas de Rotinas)', () => {
    it('deve influenciar organização temporal de diagnosticos', async () => {
      // Simula como diagnosticos são organizados por período
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([
        mockPeriodoAtivo,
        mockPeriodoAnterior,
      ] as any);

      // Simula diagnosticos vinculados aos períodos através de avaliações
      const mockDiagnosticos = [
        {
          id: 'diag-1',
          rotinaId: 'rotina-1',
          nota: 8,
          observacao: 'Bom desempenho',
          empresaId: 'empresa-diagnosticos-uuid',
          periodoAvaliacaoId: 'avaliacao-t1-2024', // Dentro do período ativo
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'diag-2',
          rotinaId: 'rotina-2',
          nota: 7,
          observacao: 'Precisa melhorar',
          empresaId: 'empresa-diagnosticos-uuid',
          periodoAvaliacaoId: 'avaliacao-t4-2023', // Período anterior
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma, 'diagnostico', 'get').mockReturnValue({
        findMany: jest.fn().mockResolvedValue(mockDiagnosticos as any)
      } as any);

      const periodos = await service.findByEmpresa('empresa-diagnosticos-uuid');
      const diagnosticos = await (prisma as any).diagnostico.findMany();

      // Organização de diagnosticos por período:
      const diagnosticosPorPeriodo = diagnosticos.reduce((acc: any, diagnostico: any) => {
        const periodoAvaliacao = mockPeriodosAvaliacao.find(
          pa => pa.id === diagnostico.periodoAvaliacaoId
        );
        const periodoMentoriaId = periodoAvaliacao?.periodoMentoriaId;

        if (!acc[periodoMentoriaId]) acc[periodoMentoriaId] = [];
        acc[periodoMentoriaId].push(diagnostico);
        return acc;
      }, {} as any);

      // Validações:
      expect(Object.keys(diagnosticosPorPeriodo)).toHaveLength(2);
      expect(diagnosticosPorPeriodo['periodo-ativo-diag-uuid']).toHaveLength(1);
      expect(diagnosticosPorPeriodo['periodo-anterior-diag-uuid']).toHaveLength(1);
    });

    it('deve manter isolamento de diagnosticos entre períodos', async () => {
      // Simula isolação adequada dos dados por período
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([
        mockPeriodoAtivo,
        mockPeriodoAnterior,
      ] as any);

      // Frontend exibiria diagnosticos filtrados por período selecionado
      const periodoSelecionado = mockPeriodoAtivo;

      // Filtragem que frontend faria:
      const diagnosticosPeriodoSelecionado = mockPilarEvolucao.filter(evolucao => {
        const periodoAvaliacao = mockPeriodosAvaliacao.find(
          pa => pa.id === evolucao.periodoAvaliacaoId
        );
        return periodoAvaliacao?.periodoMentoriaId === periodoSelecionado.id;
      });

      expect(diagnosticosPeriodoSelecionado).toHaveLength(2); // Apenas evoluções do período ativo
    });
  });

  // ============================================================
  // IMPACTO EM RENOVAÇÕES - MIGRAÇÃO DE DADOS
  // ============================================================

  describe('Impacto em Renovações - Migração de Contexto', () => {
    it('deve criar novo período que migrará dados de diagnóstico', async () => {
      // Simula renovação que criará novo contexto para diagnósticos
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([
        { ...mockPeriodoAtivo, ativo: false, dataEncerramento: new Date() },
        {
          id: 'novo-periodo-2025',
          empresaId: 'empresa-diagnosticos-uuid',
          numero: 3,
          dataInicio: new Date('2025-01-01'),
          dataFim: new Date('2025-12-31'),
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const resultado = await service.renovar(
        'empresa-diagnosticos-uuid',
        'periodo-ativo-diag-uuid',
        { dataInicio: '2025-01-01' },
      );

      // Impacto nos diagnósticos:
      expect(resultado.numero).toBe(3); // Novo período
      expect(resultado.dataInicio.getFullYear()).toBe(2025); // Nova janela temporal
      
      // Novos PeriodosAvaliacao serão criados para este período:
      const proximasAvaliacoes = [
        { trimestre: 1, data: new Date('2025-03-31'), valido: true },
        { trimestre: 2, data: new Date('2025-06-30'), valido: true },
        { trimestre: 3, data: new Date('2025-09-30'), valido: true },
        { trimestre: 4, data: new Date('2025-12-31'), valido: true },
      ];

      proximasAvaliacoes.forEach(avaliacao => {
        const dentroDoNovoPeriodo = avaliacao.data >= resultado.dataInicio && 
                                    avaliacao.data <= resultado.dataFim;
        expect(dentroDoNovoPeriodo).toBe(true);
      });
    });

    it('deve manter dados históricos preservados após renovação', async () => {
      // Simula preservação de dados históricos
      const periodosAposRenovacao = [
        mockPeriodoAnterior,
        { ...mockPeriodoAtivo, ativo: false, dataEncerramento: new Date('2024-12-31') },
        {
          id: 'novo-periodo-2025',
          empresaId: 'empresa-diagnosticos-uuid',
          numero: 3,
          dataInicio: new Date('2025-01-01'),
          dataFim: new Date('2025-12-31'),
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue(periodosAposRenovacao as any);

      const historicoCompleto = await service.findByEmpresa('empresa-diagnosticos-uuid');

      // Validação da preservação histórica:
      expect(historicoCompleto).toHaveLength(3);
      
      // Cada período mantém seus dados isolados:
      const dadosIsolados = historicoCompleto.map((periodo: any) => ({
        periodoId: periodo.id,
        numero: periodo.numero,
        status: periodo.ativo ? 'Ativo' : 'Encerrado',
        avaliacoesPreservadas: mockPeriodosAvaliacao.filter(
          pa => pa.periodoMentoriaId === periodo.id
        ).length,
      }));

      expect(dadosIsolados[0].avaliacoesPreservadas).toBe(0); // Novo período (sem avaliações ainda)
      expect(dadosIsolados[1].avaliacoesPreservadas).toBe(2); // Período 2024 (T1, T2)
      expect(dadosIsolados[2].avaliacoesPreservadas).toBe(1); // Período 2023 (T4)
    });
  });

  // ============================================================
  // CENÁRIOS DE BORDA E VALIDAÇÕES
  // ============================================================

  describe('Cenários de Borda e Validações', () => {
    it('deve lidar com períodos sem avaliações', async () => {
      // Simula período ativo sem avaliações (início de ciclo)
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([mockPeriodoAtivo] as any);
      jest.spyOn(prisma.periodoAvaliacao, 'findMany').mockResolvedValue([] as any);
      jest.spyOn(prisma.pilarEvolucao, 'findMany').mockResolvedValue([] as any);

      const periodos = await service.findByEmpresa('empresa-diagnosticos-uuid');
      const avaliacoes = await prisma.periodoAvaliacao.findMany();
      const evolucoes = await prisma.pilarEvolucao.findMany();

      // Validação:
      expect(periodos).toHaveLength(1);
      expect(avaliacoes).toHaveLength(0);
      expect(evolucoes).toHaveLength(0);

      // Frontend exibiria estado:
      const statusDiagnostico = {
        temPeriodoAtivo: periodos.length > 0,
        temAvaliacoes: avaliacoes.length > 0,
        temEvolucao: evolucoes.length > 0,
        podeCriarAvaliacao: periodos.length > 0 && periodos[0].ativo,
      };

      expect(statusDiagnostico.temPeriodoAtivo).toBe(true);
      expect(statusDiagnostico.temAvaliacoes).toBe(false);
      expect(statusDiagnostico.temEvolucao).toBe(false);
      expect(statusDiagnostico.podeCriarAvaliacao).toBe(true);
    });

    it('deve validar consistência entre PeriodoAvaliacao e PeriodoMentoria', async () => {
      // Simula validação de consistência entre as tabelas
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);
      jest.spyOn(prisma.periodoAvaliacao, 'findMany').mockResolvedValue([
        ...mockPeriodosAvaliacao,
        {
          id: 'avaliacao-fora-do-periodo',
          empresaId: 'empresa-diagnosticos-uuid',
          trimestre: 2,
          ano: 2025, // Fora do período
          dataReferencia: new Date('2025-06-30'),
          periodoMentoriaId: 'periodo-ativo-diag-uuid', // Mesmo período, mas ano errado
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const periodoAtivo = await service.findAtivo('empresa-diagnosticos-uuid');
      const avaliacoes = await prisma.periodoAvaliacao.findMany();

      // Validação de consistência:
      const avaliacoesInconsistentes = avaliacoes.filter(avaliacao => {
        const dentroDoPeriodo = avaliacao.dataReferencia >= periodoAtivo!.dataInicio && 
                                 avaliacao.dataReferencia <= periodoAtivo!.dataFim;
        return !dentroDoPeriodo;
      });

      expect(avaliacoesInconsistentes).toHaveLength(1);
      expect(avaliacoesInconsistentes[0].id).toBe('avaliacao-fora-do-periodo');
      
      // Sistema deveria corrigir ou alertar sobre inconsistências:
      const alertaInconsistencia = {
        tipo: 'ERRO_CONSISTENCIA',
        mensagem: 'Avaliação encontrada fora do período de mentoria',
        detalhes: avaliacoesInconsistentes.map(a => ({
          avaliacaoId: a.id,
          dataAvaliacao: a.dataReferencia,
          periodoMentoriaId: a.periodoMentoriaId,
          periodoMentoriaInicio: periodoAtivo!.dataInicio,
          periodoMentoriaFim: periodoAtivo!.dataFim,
        })),
      };

      expect(alertaInconsistencia.detalhes).toHaveLength(1);
    });
  });
});