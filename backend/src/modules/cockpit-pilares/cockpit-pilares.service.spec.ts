import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CockpitPilaresService } from './cockpit-pilares.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('CockpitPilaresService', () => {
  let service: CockpitPilaresService;
  let prisma: PrismaService;
  let audit: AuditService;

  const mockAdminUser = {
    id: 'admin-id',
    email: 'admin@test.com',
    nome: 'Admin',
    empresaId: 'empresa-a',
    perfil: { codigo: 'ADMINISTRADOR', nivel: 1 },
  };

  const mockGestorEmpresaA = {
    id: 'gestor-a-id',
    email: 'gestor-a@test.com',
    nome: 'Gestor A',
    empresaId: 'empresa-a',
    perfil: { codigo: 'GESTOR', nivel: 2 },
  };

  const mockGestorEmpresaB = {
    id: 'gestor-b-id',
    email: 'gestor-b@test.com',
    nome: 'Gestor B',
    empresaId: 'empresa-b',
    perfil: { codigo: 'GESTOR', nivel: 2 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CockpitPilaresService,
        {
          provide: PrismaService,
          useValue: {
            cockpitPilar: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            pilarEmpresa: {
              findUnique: jest.fn(),
            },
            rotinaEmpresa: {
              findMany: jest.fn(),
            },
            processoPrioritario: {
              createMany: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            indicadorCockpit: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            indicadorMensal: {
              createMany: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            usuario: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CockpitPilaresService>(CockpitPilaresService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCockpit', () => {
    it('deve criar cockpit e vincular rotinas automaticamente', async () => {
      const pilarEmpresa = {
        id: 'pilar-empresa-1',
        empresaId: 'empresa-a',
        nome: 'Marketing',
        cockpit: null,
        empresa: { id: 'empresa-a' },
      };

      const rotinas = [
        { id: 'rotina-1', nome: 'Rotina 1', ordem: 1 },
        { id: 'rotina-2', nome: 'Rotina 2', ordem: 2 },
        { id: 'rotina-3', nome: 'Rotina 3', ordem: 3 },
      ];

      const cockpitCriado = {
        id: 'cockpit-1',
        pilarEmpresaId: 'pilar-empresa-1',
        entradas: 'Pedidos',
        saidas: 'Propostas',
        missao: 'Crescimento',
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);
      jest.spyOn(prisma.cockpitPilar, 'create').mockResolvedValue(cockpitCriado as any);
      jest.spyOn(prisma.rotinaEmpresa, 'findMany').mockResolvedValue(rotinas as any);
      jest.spyOn(prisma.processoPrioritario, 'createMany').mockResolvedValue({ count: 3 } as any);
      jest.spyOn(prisma.cockpitPilar, 'findUnique').mockResolvedValue({
        ...cockpitCriado,
        pilarEmpresa,
        indicadores: [],
        processosPrioritarios: rotinas.map((r, i) => ({
          id: `processo-${i}`,
          cockpitPilarId: 'cockpit-1',
          rotinaEmpresaId: r.id,
          rotinaEmpresa: r,
          ordem: i + 1,
        })),
      } as any);

      const resultado = await service.createCockpit(
        {
          pilarEmpresaId: 'pilar-empresa-1',
          entradas: 'Pedidos',
          saidas: 'Propostas',
          missao: 'Crescimento',
        },
        mockGestorEmpresaA,
      );

      expect(resultado).toBeDefined();
      expect(resultado?.processosPrioritarios).toHaveLength(3);
      expect(prisma.processoPrioritario.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            cockpitPilarId: 'cockpit-1',
            rotinaEmpresaId: 'rotina-1',
            ordem: 1,
          }),
        ]),
      });
      expect(audit.log).toHaveBeenCalled();
    });

    it('deve validar multi-tenant (GESTOR só acessa própria empresa)', async () => {
      const pilarEmpresa = {
        id: 'pilar-empresa-1',
        empresaId: 'empresa-b',
        nome: 'Marketing',
        cockpit: null,
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);

      await expect(
        service.createCockpit(
          { pilarEmpresaId: 'pilar-empresa-1' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve impedir criação de cockpit duplicado', async () => {
      const pilarEmpresa = {
        id: 'pilar-empresa-1',
        empresaId: 'empresa-a',
        nome: 'Marketing',
        cockpit: { id: 'cockpit-existente' },
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);

      await expect(
        service.createCockpit(
          { pilarEmpresaId: 'pilar-empresa-1' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createIndicador', () => {
    it('deve criar indicador com 13 meses vazios', async () => {
      const cockpit = {
        id: 'cockpit-1',
        pilarEmpresa: {
          empresa: { id: 'empresa-a' },
          nome: 'Marketing',
        },
      };

      const indicadorCriado = {
        id: 'indicador-1',
        cockpitPilarId: 'cockpit-1',
        nome: 'Faturamento Mensal',
        tipoMedida: 'REAL',
        statusMedicao: 'MEDIDO_CONFIAVEL',
        melhor: 'MAIOR',
        ordem: 1,
      };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prisma.indicadorCockpit, 'create').mockResolvedValue(indicadorCriado as any);
      jest.spyOn(prisma.indicadorMensal, 'createMany').mockResolvedValue({ count: 13 } as any);
      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue({
        ...indicadorCriado,
        mesesIndicador: Array(13).fill({ meta: null, realizado: null }),
      } as any);

      const resultado = await service.createIndicador(
        'cockpit-1',
        {
          nome: 'Faturamento Mensal',
          tipoMedida: 'REAL' as any,
          statusMedicao: 'MEDIDO_CONFIAVEL' as any,
          melhor: 'MAIOR' as any,
        },
        mockGestorEmpresaA,
      );

      expect(prisma.indicadorMensal.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ mes: 1 }),
          expect.objectContaining({ mes: 12 }),
          expect.objectContaining({ mes: null }), // Anual
        ]),
      });
      const createManyCall = (prisma.indicadorMensal.createMany as jest.Mock).mock.calls[0][0];
      expect(createManyCall.data).toHaveLength(13);
    });

    it('deve validar nome único por cockpit', async () => {
      const cockpit = {
        id: 'cockpit-1',
        pilarEmpresa: {
          empresa: { id: 'empresa-a' },
          nome: 'Marketing',
        },
      };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue({
        id: 'indicador-existente',
        nome: 'Faturamento Mensal',
      } as any);

      await expect(
        service.createIndicador(
          'cockpit-1',
          {
            nome: 'Faturamento Mensal',
            tipoMedida: 'REAL' as any,
            statusMedicao: 'MEDIDO_CONFIAVEL' as any,
            melhor: 'MAIOR' as any,
          },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('deve validar que responsável pertence à mesma empresa', async () => {
      const cockpit = {
        id: 'cockpit-1',
        pilarEmpresa: {
          empresa: { id: 'empresa-a' },
          nome: 'Marketing',
        },
      };

      const responsavel = {
        id: 'usuario-b',
        empresaId: 'empresa-b',
      };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(responsavel as any);

      await expect(
        service.createIndicador(
          'cockpit-1',
          {
            nome: 'Faturamento Mensal',
            tipoMedida: 'REAL' as any,
            statusMedicao: 'MEDIDO_CONFIAVEL' as any,
            melhor: 'MAIOR' as any,
            responsavelMedicaoId: 'usuario-b',
          },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateValoresMensais', () => {
    it('deve atualizar valores mensais via batch', async () => {
      const indicador = {
        id: 'indicador-1',
        cockpitPilarId: 'cockpit-1',
      };

      const mes1 = { id: 'mes-1', ano: 2026, mes: 1 };
      const mes2 = { id: 'mes-2', ano: 2026, mes: 2 };

      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(indicador as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.indicadorMensal, 'findFirst')
        .mockResolvedValueOnce(mes1 as any)
        .mockResolvedValueOnce(mes2 as any);
      jest.spyOn(prisma.indicadorMensal, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.indicadorMensal, 'findMany').mockResolvedValue([mes1, mes2] as any);

      const resultado = await service.updateValoresMensais(
        'indicador-1',
        {
          valores: [
            { ano: 2026, mes: 1, meta: 1500000, realizado: 1350000 },
            { ano: 2026, mes: 2, meta: 1600000, realizado: 1420000 },
          ],
        },
        mockGestorEmpresaA,
      );

      expect(prisma.indicadorMensal.update).toHaveBeenCalledTimes(2);
      expect(audit.log).toHaveBeenCalled();
    });
  });
});
