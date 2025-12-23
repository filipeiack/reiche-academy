import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PilaresEmpresaService } from './pilares-empresa.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * QA UNITÁRIO ESTRITO - PilaresEmpresa
 * Valida GAP-3 (R-PILEMP-003), multi-tenancy, cascata lógica
 * Testes de idempotência e edge cases
 */
describe('PilaresEmpresaService - Validação Completa', () => {
  let service: PilaresEmpresaService;
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

  const mockPilarEmpresaList = [
    {
      id: 'pe-1',
      empresaId: 'empresa-a',
      pilarId: 'pilar-1',
      ordem: 1,
      ativo: true,
      pilar: {
        id: 'pilar-1',
        nome: 'Estratégia',
        modelo: true,
        ativo: true,
        _count: { rotinas: 3, empresas: 5 },
      },
    },
    {
      id: 'pe-2',
      empresaId: 'empresa-a',
      pilarId: 'pilar-2',
      ordem: 2,
      ativo: true,
      pilar: {
        id: 'pilar-2',
        nome: 'Marketing',
        modelo: true,
        ativo: true,
        _count: { rotinas: 2, empresas: 4 },
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PilaresEmpresaService,
        {
          provide: PrismaService,
          useValue: {
            pilarEmpresa: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              createMany: jest.fn(),
            },
            pilar: {
              findMany: jest.fn(),
            },
            usuario: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn((ops) => Promise.all(ops)),
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

    service = module.get<PilaresEmpresaService>(PilaresEmpresaService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // MULTI-TENANCY VALIDATION
  // ============================================================

  describe('Multi-Tenancy: validateTenantAccess', () => {
    it('ADMINISTRADOR deve ter acesso global a qualquer empresa', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      await service.findByEmpresa('empresa-b', mockAdminUser as any);

      // Não deve lançar exceção mesmo acessando empresa diferente
      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalled();
    });

    it('GESTOR só pode acessar sua própria empresa', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      await service.findByEmpresa('empresa-a', mockGestorEmpresaA as any);

      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalled();
    });

    it('GESTOR não pode acessar empresa de outro', async () => {
      await expect(
        service.findByEmpresa('empresa-b', mockGestorEmpresaA as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar ForbiddenException com mensagem clara', async () => {
      await expect(
        service.findByEmpresa('empresa-b', mockGestorEmpresaA as any),
      ).rejects.toThrow('Você não pode acessar dados de outra empresa');
    });
  });

  // ============================================================
  // R-PILEMP-001: Listagem por empresa
  // ============================================================

  describe('R-PILEMP-001: Listagem de pilares por empresa', () => {
    it('deve retornar pilares ordenados por PilarEmpresa.ordem', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      const result = await service.findByEmpresa('empresa-a', mockGestorEmpresaA as any);

      expect(result).toEqual(mockPilarEmpresaList);
      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { ordem: 'asc' },
        }),
      );
    });

    it('deve filtrar apenas pilares ativos (PilarEmpresa.ativo e Pilar.ativo)', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([]);

      await service.findByEmpresa('empresa-a', mockAdminUser as any);

      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            empresaId: 'empresa-a',
            ativo: true,
            pilar: { ativo: true }, // Cascata lógica
          },
        }),
      );
    });

    it('deve incluir contadores _count.rotinas e _count.empresas', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      const result = await service.findByEmpresa('empresa-a', mockAdminUser as any);

      expect(result[0].pilar._count).toBeDefined();
      expect(result[0].pilar._count.rotinas).toBe(3);
      expect(result[0].pilar._count.empresas).toBe(5);
    });
  });

  // ============================================================
  // RA-PILEMP-001: Cascata lógica em desativação
  // ============================================================

  describe('RA-PILEMP-001: Cascata lógica', () => {
    it('pilar inativo (Pilar.ativo=false) não deve aparecer mesmo se PilarEmpresa.ativo=true', async () => {
      const pilarInativoNaoCascata = [
        {
          ...mockPilarEmpresaList[0],
          ativo: true, // PilarEmpresa.ativo = true
          pilar: {
            ...mockPilarEmpresaList[0].pilar,
            ativo: false, // Pilar.ativo = false
          },
        },
      ];

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([]);

      const result = await service.findByEmpresa('empresa-a', mockAdminUser as any);

      // Filtro WHERE pilar.ativo = true garante exclusão
      expect(result).toEqual([]);
      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            pilar: { ativo: true },
          }),
        }),
      );
    });

    it('preserva histórico de vinculação (PilarEmpresa.ativo não é alterado)', async () => {
      // Validação conceitual: PilarEmpresa.ativo permanece true
      // Pilar inativo some por filtro, não por alterar PilarEmpresa
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([]);

      await service.findByEmpresa('empresa-a', mockAdminUser as any);

      // Nenhum update em PilarEmpresa é feito
      expect(prisma.pilarEmpresa.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // R-PILEMP-002: Reordenação por empresa
  // ============================================================

  describe('R-PILEMP-002: Reordenação de pilares', () => {
    it('deve atualizar ordem de pilares da empresa', async () => {
      const ordens = [
        { id: 'pe-1', ordem: 2 },
        { id: 'pe-2', ordem: 1 },
      ];

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(
        [{ id: 'pe-1' }, { id: 'pe-2' }] as any,
      );
      jest.spyOn(prisma.pilarEmpresa, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      await service.reordenar('empresa-a', ordens, mockAdminUser as any);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'pilares_empresa',
          acao: 'UPDATE',
        }),
      );
    });

    it('deve validar que IDs pertencem à empresa', async () => {
      const ordens = [
        { id: 'pe-999', ordem: 1 }, // ID inválido
      ];

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([]);

      await expect(
        service.reordenar('empresa-a', ordens, mockAdminUser as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException com lista de IDs inválidos', async () => {
      const ordens = [
        { id: 'pe-1', ordem: 1 },
        { id: 'pe-999', ordem: 2 }, // Inválido
      ];

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([{ id: 'pe-1' }] as any);

      await expect(
        service.reordenar('empresa-a', ordens, mockAdminUser as any),
      ).rejects.toThrow('Pilares não encontrados nesta empresa: pe-999');
    });

    it('deve executar updates em transação atômica', async () => {
      const ordens = [
        { id: 'pe-1', ordem: 3 },
        { id: 'pe-2', ordem: 4 },
      ];

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(
        [{ id: 'pe-1' }, { id: 'pe-2' }] as any,
      );
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      await service.reordenar('empresa-a', ordens, mockAdminUser as any);

      // $transaction garante rollback se falhar
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // ============================================================
  // GAP-3: R-PILEMP-003 - Vinculação manual (incremental)
  // ============================================================

  describe('GAP-3: R-PILEMP-003 - Vinculação incremental', () => {
    it('deve vincular pilares novos sem deletar existentes', async () => {
      const pilaresIds = ['pilar-3', 'pilar-4'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([]) // Nenhum já vinculado
        .mockResolvedValueOnce(mockPilarEmpresaList as any); // Lista final
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-3', ativo: true },
        { id: 'pilar-4', ativo: true },
      ] as any);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue({ ordem: 2 } as any);
      jest.spyOn(prisma.pilarEmpresa, 'createMany').mockResolvedValue({ count: 2 } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);

      const result = await service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any);

      expect(result.vinculados).toBe(2);
      expect(result.ignorados).toEqual([]);
      expect(prisma.pilarEmpresa.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            empresaId: 'empresa-a',
            pilarId: 'pilar-3',
            ordem: 3, // max ordem (2) + 1
            createdBy: 'admin-id',
          }),
          expect.objectContaining({
            empresaId: 'empresa-a',
            pilarId: 'pilar-4',
            ordem: 4, // max ordem (2) + 2
            createdBy: 'admin-id',
          }),
        ]),
      });
    });

    it('deve ignorar pilares já vinculados (idempotência)', async () => {
      const pilaresIds = ['pilar-1', 'pilar-2', 'pilar-3'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([
          { pilarId: 'pilar-1' },
          { pilarId: 'pilar-2' },
        ] as any) // Já vinculados
        .mockResolvedValueOnce(mockPilarEmpresaList as any);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-3', ativo: true },
      ] as any);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue({ ordem: 2 } as any);
      jest.spyOn(prisma.pilarEmpresa, 'createMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);

      const result = await service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any);

      expect(result.vinculados).toBe(1);
      expect(result.ignorados).toEqual(['pilar-1', 'pilar-2']);
    });

    it('deve retornar estatísticas corretas', async () => {
      const pilaresIds = ['pilar-1', 'pilar-3'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([{ pilarId: 'pilar-1' }] as any) // Já vinculado
        .mockResolvedValueOnce(mockPilarEmpresaList as any);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-3', ativo: true },
      ] as any);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue({ ordem: 5 } as any);
      jest.spyOn(prisma.pilarEmpresa, 'createMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);

      const result = await service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any);

      expect(result).toEqual({
        vinculados: 1,
        ignorados: ['pilar-1'],
        pilares: mockPilarEmpresaList,
      });
    });

    it('deve validar que pilares existem e estão ativos', async () => {
      const pilaresIds = ['pilar-999', 'pilar-inativo'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([]); // Nenhum encontrado

      await expect(
        service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException com IDs inválidos', async () => {
      const pilaresIds = ['pilar-3', 'pilar-999'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-3', ativo: true },
      ] as any);

      await expect(
        service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any),
      ).rejects.toThrow('Pilares não encontrados ou inativos: pilar-999');
    });

    it('deve calcular próxima ordem automaticamente', async () => {
      const pilaresIds = ['pilar-5'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([]) // Nenhum já vinculado
        .mockResolvedValueOnce(mockPilarEmpresaList as any);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-5', ativo: true },
      ] as any);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue({ ordem: 10 } as any);
      jest.spyOn(prisma.pilarEmpresa, 'createMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);

      await service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any);

      expect(prisma.pilarEmpresa.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            ordem: 11, // max (10) + 1
          }),
        ]),
      });
    });

    it('deve usar ordem 1 se empresa não tiver pilares', async () => {
      const pilaresIds = ['pilar-1'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-1', ativo: true },
      ] as any);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue(null); // Nenhum pilar vinculado
      jest.spyOn(prisma.pilarEmpresa, 'createMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);

      await service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any);

      expect(prisma.pilarEmpresa.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            ordem: 1, // null + 1 = 1
          }),
        ]),
      });
    });

    it('deve auditar apenas se houver novos vínculos', async () => {
      const pilaresIds = ['pilar-1', 'pilar-2'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([
          { pilarId: 'pilar-1' },
          { pilarId: 'pilar-2' },
        ] as any) // Todos já vinculados
        .mockResolvedValueOnce(mockPilarEmpresaList as any);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-1', ativo: true },
        { id: 'pilar-2', ativo: true },
      ] as any);

      await service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any);

      // Nenhum novo vínculo criado → sem auditoria
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('deve auditar quando houver novos vínculos', async () => {
      const pilaresIds = ['pilar-3'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([]) // Nenhum já vinculado
        .mockResolvedValueOnce(mockPilarEmpresaList as any);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-3', ativo: true },
      ] as any);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue({ ordem: 2 } as any);
      jest.spyOn(prisma.pilarEmpresa, 'createMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);

      await service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-id',
          entidade: 'pilares_empresa',
          acao: 'UPDATE',
          dadosAntes: { pilaresAnteriores: 0 },
          dadosDepois: {
            novosVinculos: 1,
            pilaresIds: ['pilar-3'],
          },
        }),
      );
    });

    it('deve respeitar multi-tenancy (GESTOR só acessa sua empresa)', async () => {
      await expect(
        service.vincularPilares('empresa-b', ['pilar-1'], mockGestorEmpresaA as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ADMINISTRADOR pode vincular em qualquer empresa', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-1', ativo: true },
      ] as any);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.pilarEmpresa, 'createMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);

      await service.vincularPilares('empresa-z', ['pilar-1'], mockAdminUser as any);

      // Não deve lançar exceção
      expect(prisma.pilarEmpresa.createMany).toHaveBeenCalled();
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases - PilaresEmpresa', () => {
    it('deve lidar com array vazio de pilares (0 vinculados)', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([]) // Nenhum pilar já vinculado
        .mockResolvedValueOnce(mockPilarEmpresaList as any); // Retorno final
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([]);

      const result = await service.vincularPilares('empresa-a', [], mockAdminUser as any);

      expect(result.vinculados).toBe(0);
      expect(result.ignorados).toEqual([]);
      expect(prisma.pilarEmpresa.createMany).not.toHaveBeenCalled();
    });

    it('deve preservar ordem sequencial com múltiplos novos pilares', async () => {
      const pilaresIds = ['pilar-7', 'pilar-8', 'pilar-9'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-7', ativo: true },
        { id: 'pilar-8', ativo: true },
        { id: 'pilar-9', ativo: true },
      ] as any);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue({ ordem: 5 } as any);
      jest.spyOn(prisma.pilarEmpresa, 'createMany').mockResolvedValue({ count: 3 } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);

      await service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any);

      expect(prisma.pilarEmpresa.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ pilarId: 'pilar-7', ordem: 6 }),
          expect.objectContaining({ pilarId: 'pilar-8', ordem: 7 }),
          expect.objectContaining({ pilarId: 'pilar-9', ordem: 8 }),
        ],
      });
    });

    it('deve filtrar pilares inativos mesmo se IDs fornecidos', async () => {
      const pilaresIds = ['pilar-ativo', 'pilar-inativo'];

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([
        { id: 'pilar-ativo', ativo: true },
        // pilar-inativo não retornado (WHERE ativo: true)
      ] as any);

      await expect(
        service.vincularPilares('empresa-a', pilaresIds, mockAdminUser as any),
      ).rejects.toThrow('Pilares não encontrados ou inativos: pilar-inativo');
    });
  });
});
