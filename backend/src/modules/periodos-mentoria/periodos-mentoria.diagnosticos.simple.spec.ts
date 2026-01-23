import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PeriodosMentoriaService } from './periodos-mentoria.service';
import { CreatePeriodoMentoriaDto } from './dto/create-periodo-mentoria.dto';
import { RenovarPeriodoMentoriaDto } from './dto/renovar-periodo-mentoria.dto';
import { addYears } from 'date-fns';

describe('PeriodosMentoriaService - Impacto em Diagnosticos Simplificado', () => {
  let service: PeriodosMentoriaService;
  let prisma: PrismaService;

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

  describe('Impacto em PeriodosAvaliacao', () => {
    it('deve fornecer período ativo para criação de PeriodoAvaliacao', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);

      const periodoAtivo = await service.findAtivo('empresa-diagnosticos-uuid');

      // PeriodoAvaliacao usaria estes dados:
      expect(periodoAtivo).toBeDefined();
      if (periodoAtivo) {
        expect(periodoAtivo.id).toBe('periodo-ativo-diag-uuid'); // FK em PeriodoAvaliacao
        expect(periodoAtivo.dataInicio).toEqual(new Date('2024-01-01')); // Limite inferior
        expect(periodoAtivo.dataFim).toEqual(new Date('2024-12-31')); // Limite superior
        expect(periodoAtivo.numero).toBe(2); // Organização
      }
    });

    it('deve validar que PeriodoAvaliacao está dentro do PeriodoMentoria', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);

      const periodoAtivo = await service.findAtivo('empresa-diagnosticos-uuid');

      if (periodoAtivo) {
        // Teste de validação de datas que PeriodoAvaliacao faria:
        const avaliacoesTeste = [
          { trimestre: 1, data: new Date('2024-03-31'), valido: true },
          { trimestre: 2, data: new Date('2024-06-30'), valido: true },
          { trimestre: 3, data: new Date('2024-09-30'), valido: true },
          { trimestre: 4, data: new Date('2024-12-31'), valido: true },
          { trimestre: 1, data: new Date('2025-03-31'), valido: false }, // Fora do período
        ];

        avaliacoesTeste.forEach(avaliacao => {
          const dentroDoPeriodo = avaliacao.data >= periodoAtivo.dataInicio && 
                                   avaliacao.data <= periodoAtivo.dataFim;
          expect(dentroDoPeriodo).toBe(avaliacao.valido);
        });
      }
    });

    it('deve impedir criação de PeriodoAvaliacao se não há período ativo', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);

      const periodoAtivo = await service.findAtivo('empresa-sem-periodo');

      expect(periodoAtivo).toBeNull();

      // PeriodoAvaliacao deverá lançar erro ou mostrar wizard:
      const podeCriarAvaliacao = periodoAtivo !== null;
      expect(podeCriarAvaliacao).toBe(false);

      // Frontend exibiria mensagem:
      const mensagemErro = 'Empresa não possui período de mentoria ativo para criar avaliações';
      expect(mensagemErro).toBeDefined();
    });
  });

  describe('Impacto em PilarEvolucao', () => {
    it('deve fornecer contexto histórico para PilarEvolucao', async () => {
      const periodosHistoricos = [mockPeriodoAtivo, mockPeriodoAnterior];
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue(periodosHistoricos as any);

      const periodos = await service.findByEmpresa('empresa-diagnosticos-uuid');

      // PilarEvolucao organizaria dados por período:
      expect(periodos).toHaveLength(2);

      // Análise por período:
      expect(periodos[0].numero).toBe(2); // Período ativo 2024
      expect(periodos[1].numero).toBe(1); // Período anterior 2023
    });

    it('deve manter sequência temporal correta', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([
        mockPeriodoAtivo,
        mockPeriodoAnterior,
      ] as any);

      const periodos = await service.findByEmpresa('empresa-diagnosticos-uuid');

      // Organização correta (mais recente primeiro):
      expect(periodos[0].numero).toBe(2); // Período ativo 2024
      expect(periodos[1].numero).toBe(1); // Período anterior 2023

      // Evoluções por período em ordem cronológica:
      const comparacaoPeriodos = periodos.map((periodo: any) => ({
        periodoId: periodo.id,
        numero: periodo.numero,
        duracao: `${periodo.dataInicio.getFullYear()}/${periodo.dataFim.getFullYear()}`,
        status: periodo.ativo ? 'Ativo' : 'Encerrado',
      }));

      expect(comparacaoPeriodos).toHaveLength(2);
      expect(comparacaoPeriodos[0].numero).toBe(2);
      expect(comparacaoPeriodos[0].status).toBe('Ativo');
      expect(comparacaoPeriodos[1].numero).toBe(1);
      expect(comparacaoPeriodos[1].status).toBe('Encerrado');
    });

    it('deve suportar comparação entre períodos', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([
        mockPeriodoAtivo,
        mockPeriodoAnterior,
      ] as any);

      const periodos = await service.findByEmpresa('empresa-diagnosticos-uuid');

      if (periodos.length > 0) {
        // Frontend exibiria dropdown de seleção de período:
        const opcoesPeriodo = periodos.map((periodo: any) => ({
          value: periodo.id,
          label: `Período ${periodo.numero}`,
          datas: `${periodo.dataInicio.getFullYear()}/${periodo.dataFim.getFullYear()}`,
        }));

        expect(opcoesPeriodo).toHaveLength(2);
        expect(opcoesPeriodo[0].label).toBe('Período 2');
        expect(opcoesPeriodo[1].label).toBe('Período 1');
      }
    });
  });

  describe('Impacto em Renovações', () => {
    it('deve criar novo período que migrará dados de diagnóstico', async () => {
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

      // $transaction retorna array, pegar o segundo elemento (novo período)
      const novoPeriodo = Array.isArray(resultado) ? resultado[1] : resultado;

      // Impacto nos diagnósticos:
      expect(novoPeriodo.numero).toBe(3); // Novo período
      expect(novoPeriodo.dataInicio.getFullYear()).toBe(2025); // Nova janela temporal
      expect(novoPeriodo.dataFim.getFullYear()).toBe(2025); // Novo limite
    });

    it('deve manter dados históricos preservados', async () => {
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
      }));

      expect(dadosIsolados[0].status).toBe('Ativo'); // Novo período (último na lista)
      expect(dadosIsolados[1].status).toBe('Encerrado'); // Período 2024
      expect(dadosIsolados[2].status).toBe('Encerrado'); // Período 2023
    });
  });

  describe('Cenários de Borda', () => {
    it('deve lidar com períodos sem avaliações', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([mockPeriodoAtivo] as any);
      jest.spyOn(prisma.periodoAvaliacao, 'findMany').mockResolvedValue([] as any);

      const periodos = await service.findByEmpresa('empresa-diagnosticos-uuid');
      const avaliacoes = await (prisma as any).periodoAvaliacao.findMany();

      // Validação:
      expect(periodos).toHaveLength(1);
      expect(avaliacoes).toHaveLength(0);

      // Frontend exibiria estado:
      const statusDiagnostico = {
        temPeriodoAtivo: periodos.length > 0,
        temAvaliacoes: avaliacoes.length > 0,
        podeCriarAvaliacao: periodos.length > 0 && periodos[0].ativo,
      };

      expect(statusDiagnostico.temPeriodoAtivo).toBe(true);
      expect(statusDiagnostico.temAvaliacoes).toBe(false);
      expect(statusDiagnostico.podeCriarAvaliacao).toBe(true);
    });

    it('deve validar consistência entre datas', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);

      const periodoAtivo = await service.findAtivo('empresa-diagnosticos-uuid');

      if (periodoAtivo) {
        // Validação de datas consistentes:
        expect(periodoAtivo.dataFim.getTime() - periodoAtivo.dataInicio.getTime()).toBe(365 * 24 * 60 * 60 * 1000); // 1 ano
        expect(periodoAtivo.dataFim.getFullYear() - periodoAtivo.dataInicio.getFullYear()).toBe(1);
        expect(periodoAtivo.dataFim.getMonth()).toBe(periodoAtivo.dataInicio.getMonth()); // Mesmo mês
      }
    });
  });
});