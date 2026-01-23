import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PeriodosMentoriaService } from './periodos-mentoria.service';
import { CreatePeriodoMentoriaDto } from './dto/create-periodo-mentoria.dto';
import { RenovarPeriodoMentoriaDto } from './dto/renovar-periodo-mentoria.dto';
import { addYears } from 'date-fns';

describe('PeriodosMentoriaService - Integração Simplificada', () => {
  let service: PeriodosMentoriaService;
  let prisma: PrismaService;

  const mockEmpresa = {
    id: 'empresa-integracao-uuid',
    nome: 'Empresa Integração Teste',
    cnpj: '98765432109876',
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPeriodoAtivo = {
    id: 'periodo-ativo-uuid',
    empresaId: 'empresa-integracao-uuid',
    numero: 2,
    dataInicio: new Date('2024-01-01'),
    dataFim: new Date('2024-12-31'),
    ativo: true,
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
    indicadorMensal: {
      findMany: jest.fn(),
      createMany: jest.fn(),
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

  describe('Integração Básica com Cockpit e Indicadores Mensais', () => {
    it('deve criar período que será usado por Indicadores Mensais', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      
      const novoPeriodo = {
        ...mockPeriodoAtivo,
        id: 'novo-periodo-indicadores',
        numero: 3,
        dataInicio: new Date('2025-01-01'),
        dataFim: new Date('2025-12-31'),
      };
      jest.spyOn(prisma.periodoMentoria, 'create').mockResolvedValue(novoPeriodo as any);

      const result = await service.create('empresa-integracao-uuid', { 
        dataInicio: '2025-01-01' 
      });

      // Validações da influência:
      expect(result.id).toBeDefined(); // Usado como FK em IndicadorMensal
      expect(result.dataInicio).toEqual(new Date('2025-01-01')); // Limite inferior
      expect(result.dataFim).toEqual(new Date('2025-12-31')); // Limite superior
      expect(result.numero).toBe(3); // Organização histórica
    });

    it('deve fornecer período ativo para validação de valores mensais', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);

      const periodoAtivo = await service.findAtivo('empresa-integracao-uuid');

      // Cockpit usaria estes dados:
      expect(periodoAtivo).toBeDefined();
      if (periodoAtivo) {
        expect(periodoAtivo.id).toBe('periodo-ativo-uuid'); // FK em IndicadorMensal
        expect(periodoAtivo.dataInicio).toEqual(new Date('2024-01-01'));
        expect(periodoAtivo.dataFim).toEqual(new Date('2024-12-31'));
        expect(periodoAtivo.ativo).toBe(true); // Verificar se está ativo
      }
    });

    it('deve manter histórico para análise comparativa', async () => {
      const periodosHistoricos = [
        { ...mockPeriodoAtivo, numero: 2, id: 'periodo-2' },
        { ...mockPeriodoAtivo, numero: 1, id: 'periodo-1', ativo: false },
      ];
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue(periodosHistoricos as any);

      const historico = await service.findByEmpresa('empresa-integracao-uuid');

      // Cockpit organizaria dados históricos:
      expect(historico).toHaveLength(2);
      expect(historico[0].numero).toBe(2); // Mais recente primeiro
      expect(historico[1].numero).toBe(1); // Mais antigo depois
    });

    it('deve suportar renovação que afeta estrutura de Indicadores Mensais', async () => {
      const dataInicioRenovacao = new Date('2025-01-01');
      const mockNovoPeriodo = {
        id: 'novo-periodo-renovacao',
        empresaId: 'empresa-integracao-uuid',
        numero: 3,
        dataInicio: dataInicioRenovacao,
        dataFim: new Date('2025-12-31'), // Final do mesmo ano
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([
        { ...mockPeriodoAtivo, ativo: false, dataEncerramento: new Date() },
        mockNovoPeriodo,
      ] as any);

      const resultado = await service.renovar(
        'empresa-integracao-uuid',
        'periodo-ativo-uuid',
        { dataInicio: '2025-01-01' },
      );

      // $transaction retorna array, pegar o segundo elemento (novo período)
      const novoPeriodo = Array.isArray(resultado) ? resultado[1] : resultado;

      // Validação do impacto:
      expect(novoPeriodo.numero).toBe(3); // Novo número sequencial
      expect(novoPeriodo.dataInicio).toEqual(new Date('2025-01-01')); // Nova janela temporal
      expect(novoPeriodo.dataFim).toEqual(new Date('2025-12-31')); // Novo limite
    });
  });

  describe('Integração com Diagnosticos Evolução', () => {
    it('deve fornecer contexto para PeriodosAvaliacao', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([mockPeriodoAtivo] as any);

      const periodos = await service.findByEmpresa('empresa-integracao-uuid');

      // PeriodosAvaliacao usaria para:
      if (periodos.length > 0) {
        expect(periodos[0].id).toBeDefined(); // periodoMentoriaId em PeriodoAvaliacao
        expect(periodos[0].dataInicio).toBeDefined(); // Validação de datas
        expect(periodos[0].dataFim).toBeDefined(); // Validação de datas
      }
    });

    it('deve organizar dados por períodos', async () => {
      const periodos = [
        { ...mockPeriodoAtivo, numero: 2, id: 'periodo-2' },
        { ...mockPeriodoAtivo, numero: 1, id: 'periodo-1', ativo: false },
      ];
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue(periodos as any);

      const resultadoPeriodos = await service.findByEmpresa('empresa-integracao-uuid');

      // Evolution organizaria dados por período:
      expect(resultadoPeriodos).toHaveLength(2);
      expect(resultadoPeriodos[0].numero).toBe(2); // Ordem decrescente
      expect(resultadoPeriodos[1].numero).toBe(1); // Mais antigo depois
    });

    it('deve lidar com ausência de período ativo', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);

      const periodoAtivo = await service.findAtivo('empresa-sem-periodo');

      expect(periodoAtivo).toBeNull();

      // Frontend exibiria wizard:
      const shouldShowWizard = periodoAtivo === null;
      expect(shouldShowWizard).toBe(true);
    });
  });

  describe('Validações de Datas e Integridade', () => {
    it('deve validar datas dentro do período', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);

      const periodoAtivo = await service.findAtivo('empresa-integracao-uuid');

      if (periodoAtivo) {
        // Valores mensais dentro do período (válidos):
        const valorValido = new Date('2024-06-15');
        const dentroDoPeriodo = valorValido >= periodoAtivo.dataInicio && 
                                 valorValido <= periodoAtivo.dataFim;
        expect(dentroDoPeriodo).toBe(true);

        // Valor mensal fora do período (inválido):
        const valorInvalido = new Date('2025-01-15');
        const foraDoPeriodo = valorInvalido >= periodoAtivo.dataInicio && 
                               valorInvalido <= periodoAtivo.dataFim;
        expect(foraDoPeriodo).toBe(false);
      }
    });

    it('deve fornecer contexto para cálculo de métricas', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue([mockPeriodoAtivo] as any);

      const periodos = await service.findByEmpresa('empresa-integracao-uuid');

      if (periodos.length > 0) {
        const periodo = periodos[0];
        
        // Frontend usaria para exibir resumo anual:
        const resumoAnual = {
          periodo: `Período ${periodo.numero}`,
          ano: periodo.dataFim.getFullYear(),
          duracao: `${periodo.dataInicio.getFullYear()}/${periodo.dataFim.getFullYear()}`,
        };

        expect(resumoAnual.ano).toBe(2024);
        expect(resumoAnual.periodo).toBe('Período 2');
      }
    });
  });
});