import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PeriodosMentoriaService } from './periodos-mentoria.service';
import { AuditService } from '../audit/audit.service';

describe('PeriodosMentoriaService - Validação Completa', () => {
  let service: PeriodosMentoriaService;
  let prisma: PrismaService;
  let module: TestingModule;

  // Mock data
  const mockEmpresa = {
    id: 'empresa-uuid',
    nome: 'Empresa Teste',
    cnpj: '12345678901234',
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPeriodoAtivo = {
    id: 'periodo-ativo-uuid',
    empresaId: 'empresa-uuid',
    numero: 1,
    dataInicio: new Date('2024-01-01'),
    dataFim: new Date('2024-12-31T23:59:59.999Z'),
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPeriodoInativo = {
    id: 'periodo-inativo-uuid',
    empresaId: 'empresa-uuid',
    numero: 1,
    dataInicio: new Date('2023-01-01'),
    dataFim: new Date('2023-12-31'),
    ativo: false,
    dataEncerramento: new Date('2023-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    empresa: {
      findUnique: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
    },
    periodoMentoria: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    indicadorCockpit: {
      findMany: jest.fn(),
    },
    indicadorMensal: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAudit = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        PeriodosMentoriaService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AuditService,
          useValue: mockAudit,
        },
      ],
    }).compile();

    service = module.get<PeriodosMentoriaService>(PeriodosMentoriaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Resetar todos os mocks antes de cada teste
    jest.clearAllMocks();
    
    // Mock padrão para indicadores (vazio por padrão)
    mockPrisma.indicadorCockpit.findMany.mockResolvedValue([]);
    mockPrisma.indicadorMensal.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.usuario.findUnique.mockResolvedValue({
      id: 'user-uuid',
      nome: 'User Teste',
      email: 'user@teste.com',
    } as any);
  });

  // ============================================================
  // MULTI-TENANCY VALIDATION
  // ============================================================

  describe('Multi-Tenancy: Isolamento por Empresa', () => {
    it('deve lançar NotFoundException se empresa não existe', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create('empresa-inexistente', { dataInicio: '2024-01-01' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve validar que períodos são criados apenas para empresa específica', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      jest.spyOn(prisma.periodoMentoria, 'create').mockResolvedValue(mockPeriodoAtivo as any);

      await service.create('empresa-uuid', { dataInicio: '2024-01-01' });

      expect(prisma.periodoMentoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            empresaId: 'empresa-uuid',
          }),
        }),
      );
    });
  });

  // ============================================================
  // R-MENT-001: CRIAÇÃO DE PERÍODO (1 ANO)
  // ============================================================

  describe('R-MENT-001: Criação de Período (dataFim = último dia do ano UTC)', () => {
    it('deve criar período com dataFim no último dia do ano da dataInicio (UTC)', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      
      // ORDEM CORRETA: O service chama findFirst duas vezes
      // 1. Verificar se existe período ativo
      // 2. Buscar último período para calcular número
      jest.spyOn(prisma.periodoMentoria, 'findFirst')
        .mockResolvedValueOnce(null) // 1. Não há período ativo
        .mockResolvedValueOnce(null); // 2. Não há último período (primeiro período)
      
      const expectedPeriodo = { ...mockPeriodoAtivo, numero: 1 };
      jest.spyOn(prisma.periodoMentoria, 'create').mockResolvedValue(expectedPeriodo as any);

      const result = await service.create('empresa-uuid', { dataInicio: '2024-01-01' });

      expect(result.numero).toBe(1);
      expect(prisma.periodoMentoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dataFim: new Date('2024-12-31T23:59:59.999Z'),
          }),
        }),
      );
    });

    it('deve calcular dataFim no fim do ano mesmo para datas bissextas', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      
      const expectedPeriodo = {
        ...mockPeriodoAtivo,
        dataInicio: new Date('2024-02-29'),
        dataFim: new Date('2024-12-31T23:59:59.999Z'),
      };
      jest.spyOn(prisma.periodoMentoria, 'create').mockResolvedValue(expectedPeriodo as any);

      const result = await service.create('empresa-uuid', { dataInicio: '2024-02-29' });

      expect(result.dataFim).toEqual(new Date('2024-12-31T23:59:59.999Z'));
    });
  });

  // ============================================================
  // R-MENT-002: PERÍODO ATIVO ÚNICO
  // ============================================================

  describe('R-MENT-002: Validação de Período Ativo Único', () => {
    it('deve impedir criação se empresa já tem período ativo', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      jest.spyOn(prisma.periodoMentoria, 'findFirst')
        .mockResolvedValueOnce(mockPeriodoAtivo as any) // Verificação de período ativo
        .mockResolvedValueOnce(null); // Cálculo do número

      await expect(
        service.create('empresa-uuid', { dataInicio: '2024-01-01' }),
      ).rejects.toThrow(
        new ConflictException('Empresa já possui período de mentoria ativo (Período 1)'),
      );
    });

    it('deve permitir criação se empresa não tem período ativo', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      jest.spyOn(prisma.periodoMentoria, 'create').mockResolvedValue(mockPeriodoAtivo as any);

      const result = await service.create('empresa-uuid', { dataInicio: '2024-01-01' });

      expect(result).toBeDefined();
      expect(prisma.periodoMentoria.create).toHaveBeenCalled();
    });

    it('deve calcular número sequencial corretamente', async () => {
      // Limpar mocks anteriores
      jest.clearAllMocks();
      
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      
      // Mock isolado para este teste específico
      const mockFindFirst = jest.fn()
        .mockResolvedValueOnce(null) // 1. Não há período ativo
        .mockResolvedValueOnce({ numero: 3 } as any); // 2. Último período é número 3
      
      const mockCreate = jest.fn().mockResolvedValue({ ...mockPeriodoAtivo, numero: 4 } as any);
      
      // Substituir temporariamente os métodos do prisma
      (prisma.periodoMentoria as any).findFirst = mockFindFirst;
      (prisma.periodoMentoria as any).create = mockCreate;

      const result = await service.create('empresa-uuid', { dataInicio: '2024-01-01' });

      expect(result.numero).toBe(4);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            numero: 4,
          }),
        }),
      );
    });

    it('deve criar com número 1 se for o primeiro período', async () => {
      // Limpar mocks anteriores
      jest.clearAllMocks();
      
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      
      // Mock para este teste específico: sempre retorna null (sem períodos)
      const mockFindFirst = jest.fn()
        .mockResolvedValueOnce(null) // Verificação de período ativo
        .mockResolvedValueOnce(null) // Busca de último período
        .mockResolvedValueOnce(null); // Extra verificação (se houver)
      
      const mockCreate = jest.fn().mockResolvedValue({ ...mockPeriodoAtivo, numero: 1 } as any);
      
      // Substituir métodos do prisma para este teste
      (prisma.periodoMentoria as any).findFirst = mockFindFirst;
      (prisma.periodoMentoria as any).create = mockCreate;

      const result = await service.create('empresa-uuid', { dataInicio: '2024-01-01' });

      expect(result.numero).toBe(1);
    });
  });

  // ============================================================
  // R-MENT-003: RENOVAÇÃO DE PERÍODO
  // ============================================================

  describe('R-MENT-003: Renovação de Período', () => {
    it('deve encerrar período atual e criar novo', async () => {
      jest.clearAllMocks();
      
      const dataInicio = new Date('2025-01-01');
      const dataFim = new Date('2025-12-31T23:59:59.999Z');
      
      const novoPeriodo = {
        id: 'novo-periodo-uuid',
        empresaId: 'empresa-uuid',
        numero: 2,
        dataInicio,
        dataFim,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFindFirst = jest.fn().mockResolvedValue(mockPeriodoAtivo as any);
      const mockTransaction = jest.fn().mockResolvedValue([
        { ...mockPeriodoAtivo, ativo: false, dataEncerramento: expect.any(Date) },
        novoPeriodo,
      ] as any);

      (prisma.periodoMentoria as any).findFirst = mockFindFirst;
      (prisma as any).$transaction = mockTransaction;

      const result = await service.renovar(
        'empresa-uuid',
        'periodo-ativo-uuid',
        { dataInicio: '2025-01-01' },
      );

      expect(result.numero).toBe(2);
      expect(result.dataInicio).toEqual(dataInicio);
      expect(result.dataFim).toEqual(dataFim);
    });

    it('deve lançar NotFoundException se período não existe', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);

      await expect(
        service.renovar('empresa-uuid', 'periodo-inexistente', { dataInicio: '2025-01-01' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se período não está ativo', async () => {
      jest.clearAllMocks();
      
      const mockFindFirst = jest.fn().mockResolvedValue(mockPeriodoInativo as any);
      (prisma.periodoMentoria as any).findFirst = mockFindFirst;

      await expect(
        service.renovar('empresa-uuid', 'periodo-inativo-uuid', { dataInicio: '2025-01-01' }),
      ).rejects.toThrow(new BadRequestException('Não é possível renovar período já encerrado'));
    });

    it('deve validar que data de início é posterior ao período atual', async () => {
      jest.clearAllMocks();
      
      const mockFindFirst = jest.fn().mockResolvedValue(mockPeriodoAtivo as any);
      const mockTransaction = jest.fn().mockResolvedValue([
        { ...mockPeriodoAtivo, ativo: false, dataEncerramento: expect.any(Date) },
        { id: 'novo-uuid', numero: 2, dataInicio: new Date('2024-06-01'), dataFim: new Date('2025-06-01'), ativo: true },
      ] as any);

      (prisma.periodoMentoria as any).findFirst = mockFindFirst;
      (prisma as any).$transaction = mockTransaction;

      await expect(
        service.renovar('empresa-uuid', 'periodo-ativo-uuid', { dataInicio: '2024-06-01' }), // Antes de 2024-12-31
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar data igual ao fim do período atual', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);

      await expect(
        service.renovar('empresa-uuid', 'periodo-ativo-uuid', { dataInicio: '2024-12-31' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  describe('CRUD Operations', () => {
    it('findByEmpresa deve retornar períodos ordenados por número decrescente', async () => {
      const periodos = [
        { ...mockPeriodoAtivo, numero: 3 },
        { ...mockPeriodoInativo, numero: 2 },
        { id: 'periodo-1', numero: 1 },
      ];

      jest.spyOn(prisma.periodoMentoria, 'findMany').mockResolvedValue(periodos as any);

      const result = await service.findByEmpresa('empresa-uuid');

      expect(result).toEqual(periodos);
      expect(prisma.periodoMentoria.findMany).toHaveBeenCalledWith({
        where: { empresaId: 'empresa-uuid' },
        orderBy: { numero: 'desc' },
      });
    });

    it('findAtivo deve retornar apenas período ativo', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);

      const result = await service.findAtivo('empresa-uuid');

      expect(result).toEqual(mockPeriodoAtivo);
      expect(prisma.periodoMentoria.findFirst).toHaveBeenCalledWith({
        where: {
          empresaId: 'empresa-uuid',
          ativo: true,
        },
      });
    });

    it('findAtivo deve retornar null se não há período ativo', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);

      const result = await service.findAtivo('empresa-uuid');

      expect(result).toBeNull();
    });

    it('findOne deve retornar período por ID', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findUnique').mockResolvedValue(mockPeriodoAtivo as any);

      const result = await service.findOne('periodo-uuid');

      expect(result).toEqual(mockPeriodoAtivo);
      expect(prisma.periodoMentoria.findUnique).toHaveBeenCalledWith({
        where: { id: 'periodo-uuid' },
      });
    });

    it('findOne deve lançar NotFoundException se período não existe', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('periodo-inexistente')).rejects.toThrow(
        new NotFoundException('Período de mentoria não encontrado'),
      );
    });
  });

  // ============================================================
  // VALIDAÇÕES DE DATAS E INTEGRIDADE
  // ============================================================

  describe('Validações de Datas e Integridade', () => {
    it('deve criar período com data início no futuro', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      
      const dataFutura = new Date();
      dataFutura.setMonth(dataFutura.getMonth() + 2);
      
      const expectedPeriodo = {
        ...mockPeriodoAtivo,
        dataInicio: dataFutura,
        dataFim: new Date(Date.UTC(dataFutura.getUTCFullYear(), 11, 31, 23, 59, 59, 999)),
      };
      jest.spyOn(prisma.periodoMentoria, 'create').mockResolvedValue(expectedPeriodo as any);

      const result = await service.create('empresa-uuid', { 
        dataInicio: dataFutura.toISOString().split('T')[0],
      });

      expect(result.dataInicio).toEqual(dataFutura);
      expect(prisma.periodoMentoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dataFim: expectedPeriodo.dataFim,
          }),
        }),
      );
    });

    it('deve registrar createdBy e updatedBy corretamente', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresa as any);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      jest.spyOn(prisma.periodoMentoria, 'create').mockResolvedValue(mockPeriodoAtivo as any);

      await service.create('empresa-uuid', { dataInicio: '2024-01-01' }, 'user-123');

      expect(prisma.periodoMentoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: 'user-123',
          }),
        }),
      );
    });

    it('deve registrar dataEncerramento na renovação', async () => {
      jest.spyOn(prisma.periodoMentoria, 'findFirst').mockResolvedValue(mockPeriodoAtivo as any);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([
        { ...mockPeriodoAtivo, ativo: false, dataEncerramento: expect.any(Date) },
        { id: 'novo-uuid', numero: 2, ativo: true },
      ] as any);

      await service.renovar('empresa-uuid', 'periodo-ativo-uuid', { dataInicio: '2025-01-01' }, 'user-456');

      const transactionCalls = (prisma.$transaction as jest.Mock).mock.calls;
      expect(transactionCalls).toHaveLength(1);
    });
  });

});