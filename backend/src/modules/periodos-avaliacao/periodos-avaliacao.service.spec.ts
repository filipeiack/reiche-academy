import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PeriodosAvaliacaoService } from './periodos-avaliacao.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PrimeiraDataDto } from './dto/primeira-data.dto';

describe('PeriodosAvaliacaoService - Janela Temporal', () => {
  let service: PeriodosAvaliacaoService;

  const mockPrisma = {
    periodoAvaliacao: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    periodoMentoria: {
      findFirst: jest.fn(),
    },
    pilarEmpresa: {
      findMany: jest.fn(),
    },
    pilarEvolucao: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const baseUser = {
    id: 'user-1',
    nome: 'Usuario Teste',
    email: 'teste@empresa.com',
    empresaId: 'empresa-1',
    perfil: { codigo: 'GESTOR' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeriodosAvaliacaoService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<PeriodosAvaliacaoService>(PeriodosAvaliacaoService);

    jest.clearAllMocks();
  });

  describe('RN-PEVOL-JANELA-001: Primeira data obrigatoria', () => {
    it('deve retornar null quando nao existe periodo', async () => {
      mockPrisma.periodoAvaliacao.findFirst.mockResolvedValue(null);

      const result = await service.getPrimeiraDataReferencia('empresa-1', baseUser as any);

      expect(result).toBeNull();
      expect(mockPrisma.periodoAvaliacao.findFirst).toHaveBeenCalledWith({
        where: { empresaId: 'empresa-1' },
        orderBy: { dataReferencia: 'asc' },
        select: { dataReferencia: true },
      });
    });
  });

  describe('RN-PEVOL-JANELA-004: Criacao da primeira data', () => {
    it('deve bloquear se nao houver nenhuma nota lancada', async () => {
      const dto: PrimeiraDataDto = { dataReferencia: '2026-02-01' };

      mockPrisma.periodoAvaliacao.findFirst.mockResolvedValue(null);
      mockPrisma.periodoMentoria.findFirst.mockResolvedValue({
        id: 'mentoria-1',
        dataInicio: new Date('2025-01-01T00:00:00.000Z'),
        dataFim: new Date('2027-01-01T00:00:00.000Z'),
      });

      mockPrisma.pilarEmpresa.findMany.mockResolvedValue([
        {
          id: 'pilar-1',
          rotinasEmpresa: [{ notas: [] }],
        },
      ]);

      await expect(
        service.criarPrimeiraData('empresa-1', dto, baseUser as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar periodo e snapshots quando existir nota', async () => {
      const dto: PrimeiraDataDto = { dataReferencia: '2026-02-01' };

      mockPrisma.periodoAvaliacao.findFirst.mockResolvedValue(null);
      mockPrisma.periodoMentoria.findFirst.mockResolvedValue({
        id: 'mentoria-1',
        dataInicio: new Date('2025-01-01T00:00:00.000Z'),
        dataFim: new Date('2027-01-01T00:00:00.000Z'),
      });

      mockPrisma.pilarEmpresa.findMany.mockResolvedValue([
        {
          id: 'pilar-1',
          rotinasEmpresa: [{ notas: [{ nota: 0 }] }],
        },
      ]);

      const tx = {
        periodoAvaliacao: {
          create: jest.fn().mockResolvedValue({ id: 'periodo-1' }),
        },
        pilarEvolucao: {
          create: jest.fn().mockResolvedValue({ id: 'snapshot-1' }),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const result = await service.criarPrimeiraData('empresa-1', dto, baseUser as any);

      expect(result.periodo.id).toBe('periodo-1');
      expect(result.snapshots).toHaveLength(1);
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('RN-PEVOL-JANELA-003: Validacao de janela temporal', () => {
    it('deve bloquear congelamento sem primeira data', async () => {
      mockPrisma.periodoAvaliacao.findFirst.mockResolvedValue(null);

      await expect(
        service.congelarAutomatico('empresa-1', baseUser as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('RN-PEVOL-JANELA-002: Recongelamento dentro da janela', () => {
    it('deve recongelar periodo existente na janela ativa', async () => {
      const primeiraData = new Date('2025-05-01T00:00:00.000Z');
      const periodoExistente = {
        id: 'periodo-1',
        empresaId: 'empresa-1',
        dataReferencia: new Date('2026-01-26T00:00:00.000Z'),
        aberto: true,
      };

      mockPrisma.periodoAvaliacao.findFirst
        .mockResolvedValueOnce({ dataReferencia: primeiraData })
        .mockResolvedValueOnce(periodoExistente);

      const spy = jest
        .spyOn(service as any, 'recongelarPeriodoAberto')
        .mockResolvedValue({ periodo: { id: 'periodo-1', aberto: true }, snapshots: [] });

      const result = await service.congelarAutomatico('empresa-1', baseUser as any);

      expect(spy).toHaveBeenCalledWith('periodo-1', 'empresa-1', baseUser);
      expect(result.periodo.aberto).toBe(true);
    });
  });

  describe('LEGACY: periodo existente no mesmo trimestre/ano', () => {
    it('deve reutilizar periodo e substituir snapshots', async () => {
      const periodoAtivo = {
        numeroPeriodo: 2,
        dataReferencia: new Date('2026-01-26T00:00:00.000Z'),
        janelaInicio: new Date('2026-01-26T00:00:00.000Z'),
        janelaFim: new Date('2026-04-24T00:00:00.000Z'),
        trimestre: 1,
        ano: 2026,
      };

      mockPrisma.periodoMentoria.findFirst.mockResolvedValue({
        id: 'mentoria-1',
        dataInicio: new Date('2025-01-01T00:00:00.000Z'),
        dataFim: new Date('2027-01-01T00:00:00.000Z'),
      });

      mockPrisma.pilarEmpresa.findMany.mockResolvedValue([
        {
          id: 'pilar-1',
          rotinasEmpresa: [{ notas: [{ nota: 7 }] }],
        },
      ]);

      mockPrisma.periodoAvaliacao.findUnique.mockResolvedValue({ id: 'periodo-1' });

      const tx = {
        periodoAvaliacao: {
          upsert: jest.fn().mockResolvedValue({ id: 'periodo-1' }),
        },
        pilarEvolucao: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          create: jest.fn().mockResolvedValue({ id: 'snapshot-1' }),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const result = await (service as any).criarNovoPeriodoAutomatico(
        'empresa-1',
        periodoAtivo,
        baseUser as any,
      );

      expect(tx.pilarEvolucao.deleteMany).toHaveBeenCalledWith({
        where: { periodoAvaliacaoId: 'periodo-1' },
      });
      expect(result.snapshots).toHaveLength(1);
    });
  });
});
