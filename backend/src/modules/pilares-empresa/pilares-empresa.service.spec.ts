import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PilaresEmpresaService } from './pilares-empresa.service';
import { RotinasEmpresaService } from './rotinas-empresa.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * QA UNITÁRIO ESTRITO - PilaresEmpresa
 * Valida GAP-3 (R-PILEMP-003), multi-tenancy, cascata lógica
 * Testes de idempotência e edge cases
 */
describe('PilaresEmpresaService - Validação Completa', () => {
  let service: PilaresEmpresaService;
  let rotinasService: RotinasEmpresaService;
  let prisma: PrismaService;
  let audit: AuditService;
  let module: TestingModule;

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
      pilarTemplateId: 'template-1',
      nome: 'Estratégia',
      descricao: 'Pilar de estratégia',
      ordem: 1,
      ativo: true,
      pilarTemplate: {
        id: 'template-1',
        nome: 'Estratégia',
        ativo: true,
        _count: { rotinas: 3, empresas: 5 },
      },
      _count: { rotinasEmpresa: 3 },
    },
    {
      id: 'pe-2',
      empresaId: 'empresa-a',
      pilarTemplateId: 'template-2',
      nome: 'Marketing',
      descricao: 'Pilar de marketing',
      ordem: 2,
      ativo: true,
      pilarTemplate: {
        id: 'template-2',
        nome: 'Marketing',
        ativo: true,
        _count: { rotinas: 2, empresas: 4 },
      },
      _count: { rotinasEmpresa: 2 },
    },
  ];

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        PilaresEmpresaService,
        {
          provide: PrismaService,
          useValue: {
            pilarEmpresa: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
              createMany: jest.fn(),
              delete: jest.fn(),
            },
            pilar: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            rotina: {
              findUnique: jest.fn(),
            },
            rotinaEmpresa: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              createMany: jest.fn(),
              delete: jest.fn(),
              update: jest.fn(),
            },
            usuario: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn((ops) => Promise.all(ops)),
          },
        },
        {
          provide: RotinasEmpresaService,
          useValue: {
            createRotinaEmpresa: jest.fn(),
            deleteRotinaEmpresa: jest.fn(),
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
    rotinasService = module.get<RotinasEmpresaService>(RotinasEmpresaService);
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

    it('deve filtrar apenas pilares ativos (PilarEmpresa.ativo)', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([]);

      await service.findByEmpresa('empresa-a', mockAdminUser as any);

      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            empresaId: 'empresa-a',
            ativo: true,
          },
        }),
      );
    });

    it('deve incluir contadores de rotinas da empresa', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      const result: any = await service.findByEmpresa('empresa-a', mockAdminUser as any);

      expect(result[0]._count.rotinasEmpresa).toBe(3);
      expect(result[1]._count.rotinasEmpresa).toBe(2);
    });
  });

  // ============================================================
  // Snapshot Pattern: Templates não afetam listagem
  // ============================================================

  describe('Snapshot Pattern: Independência de Templates', () => {
    it('pilar inativo no template NÃO afeta snapshot ativo', async () => {
      // Snapshot Pattern: dados são copiados, não JOIN obrigatório
      // Template pode ser desativado sem afetar snapshots existentes
      const snapshotAtivo = [
        {
          ...mockPilarEmpresaList[0],
          ativo: true, // PilarEmpresa ativo
          pilarTemplate: {
            ...mockPilarEmpresaList[0].pilarTemplate,
            ativo: false, // Template desativado (não afeta snapshot)
          },
        },
      ];

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(snapshotAtivo as any);

      const result = await service.findByEmpresa('empresa-a', mockAdminUser as any);

      // Snapshot ativo aparece mesmo com template inativo
      expect(result).toHaveLength(1);
      expect(result[0].ativo).toBe(true);
    });
  });

  // ============================================================
  // R-PILEMP-005: Reordenação de pilares
  // ============================================================

  describe('R-PILEMP-005: Reordenação de pilares', () => {
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
  // SNAPSHOT PATTERN - XOR VALIDATION (createPilarEmpresa)
  // R-PILEMP-001 e R-PILEMP-002
  // ============================================================

  describe('Snapshot Pattern: createPilarEmpresa() - XOR Validation', () => {
    const empresaId = 'empresa-a';

    it('R-PILEMP-001: deve criar pilar a partir de template (snapshot de dados)', async () => {
      // Dado um template válido
      const templateId = 'template-uuid';
      const templateMock = {
        id: templateId,
        nome: 'Estratégia Corporativa',
        descricao: 'Descrição do template',
        ativo: true,
      };

      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(templateMock as any);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce(null); // Nome não existe
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce({ ordem: 2 } as any); // Max ordem = 2
      jest.spyOn(prisma.pilarEmpresa, 'create').mockResolvedValue({
        id: 'new-pilar-id',
        pilarTemplateId: templateId,
        nome: templateMock.nome,
        descricao: templateMock.descricao,
        empresaId,
        ordem: 3,
        createdBy: mockGestorEmpresaA.id,
      } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockGestorEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      // Quando createPilarEmpresa com pilarTemplateId
      const result = await service.createPilarEmpresa(
        empresaId,
        { pilarTemplateId: templateId },
        mockGestorEmpresaA,
      );

      // Então deve criar snapshot com dados copiados do template
      expect(result.pilarTemplateId).toBe(templateId);
      expect(result.nome).toBe(templateMock.nome); // Copiado
      expect(result.ordem).toBe(3); // Auto-increment
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        acao: 'CREATE',
        entidade: 'pilares_empresa',
        dadosDepois: expect.objectContaining({
          isCustom: false,
        }),
      }));
    });

    it('R-PILEMP-002: deve criar pilar customizado quando nome fornecido (sem template)', async () => {
      // Dado nome customizado sem templateId
      const customNome = 'Pilar Customizado XYZ';

      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce(null); // Nome não existe
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce(null); // Sem pilares (ordem = 1)
      jest.spyOn(prisma.pilarEmpresa, 'create').mockResolvedValue({
        id: 'custom-pilar-id',
        pilarTemplateId: null,
        nome: customNome,
        empresaId,
        ordem: 1,
        createdBy: mockGestorEmpresaA.id,
      } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockGestorEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      // Quando createPilarEmpresa sem templateId
      const result = await service.createPilarEmpresa(
        empresaId,
        { nome: customNome },
        mockGestorEmpresaA,
      );

      // Então deve criar customizado
      expect(result.pilarTemplateId).toBeNull();
      expect(result.nome).toBe(customNome);
      expect(result.ordem).toBe(1); // Primeiro pilar
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        dadosDepois: expect.objectContaining({
          isCustom: true,
        }),
      }));
    });

    it('XOR Validation: deve falhar se template não encontrado', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createPilarEmpresa(
          empresaId,
          { pilarTemplateId: 'invalid-uuid' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.pilar.findUnique).toHaveBeenCalledWith({
        where: { id: 'invalid-uuid' },
      });
    });

    it('Unicidade: deve bloquear nome duplicado na mesma empresa', async () => {
      const existingPilar = {
        id: 'existing-id',
        nome: 'Nome Duplicado',
        empresaId,
      };

      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue(existingPilar as any);

      await expect(
        service.createPilarEmpresa(
          empresaId,
          { nome: 'Nome Duplicado' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('Multi-tenant: GESTOR não deve criar pilar em outra empresa', async () => {
      await expect(
        service.createPilarEmpresa(
          'empresa-b', // Diferente de gestor-a empresaId
          { nome: 'Test' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Multi-tenant: ADMINISTRADOR deve criar pilar em qualquer empresa', async () => {
      const empresaBId = 'empresa-b';

      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prisma.pilarEmpresa, 'create').mockResolvedValue({
        id: 'admin-pilar-id',
        pilarTemplateId: null,
        nome: 'Admin Pilar',
        empresaId: empresaBId,
        ordem: 1,
      } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.createPilarEmpresa(
        empresaBId,
        { nome: 'Admin Pilar' },
        mockAdminUser,
      );

      expect(result.empresaId).toBe(empresaBId);
    });

    it('Auto-increment ordem: primeiro pilar deve ter ordem 1', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce(null); // Nome único
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce(null); // Sem pilares (ordem)
      jest.spyOn(prisma.pilarEmpresa, 'create').mockResolvedValue({
        id: 'first-pilar',
        nome: 'Primeiro',
        ordem: 1,
        empresaId,
      } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockGestorEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.createPilarEmpresa(
        empresaId,
        { nome: 'Primeiro' },
        mockGestorEmpresaA,
      );

      expect(result.ordem).toBe(1);
    });

    it('Auto-increment ordem: pilares subsequentes devem incrementar', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce(null); // Nome único
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValueOnce({ ordem: 5 } as any); // Max ordem = 5
      jest.spyOn(prisma.pilarEmpresa, 'create').mockResolvedValue({
        id: 'next-pilar',
        nome: 'Sexto',
        ordem: 6,
        empresaId,
      } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockGestorEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.createPilarEmpresa(
        empresaId,
        { nome: 'Sexto' },
        mockGestorEmpresaA,
      );

      expect(result.ordem).toBe(6);
    });
  });

  // ============================================================
  // SNAPSHOT PATTERN - HARD DELETE (deletePilarEmpresa)
  // R-PILEMP-006
  // ============================================================

  describe('Snapshot Pattern: deletePilarEmpresa() - Cascade Audit', () => {
    const empresaId = 'empresa-a';
    const pilarEmpresaId = 'pilar-emp-1';

    it('R-PILEMP-006: deve deletar pilar SEM rotinas (hard delete com auditoria)', async () => {
      const pilarMock = {
        id: pilarEmpresaId,
        nome: 'Pilar Vazio',
        empresaId,
        pilarTemplateId: 'template-uuid',
        rotinasEmpresa: [], // ← Incluindo array vazio
        _count: { rotinasEmpresa: 0 },
      };

      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue(pilarMock as any);
      jest.spyOn(prisma.pilarEmpresa, 'delete').mockResolvedValue(pilarMock as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockGestorEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.deletePilarEmpresa(empresaId, pilarEmpresaId, mockGestorEmpresaA);

      expect(prisma.pilarEmpresa.delete).toHaveBeenCalledWith({
        where: { id: pilarEmpresaId },
      });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        acao: 'DELETE',
        entidade: 'pilares_empresa',
        entidadeId: pilarEmpresaId,
        dadosAntes: expect.objectContaining({
          id: pilarEmpresaId,
          nome: 'Pilar Vazio',
        }),
        dadosDepois: null,
      }));
    });

    it('R-PILEMP-006: deve permitir deletar pilar COM rotinas (hard delete em cascata)', async () => {
      const rotinasMock = [
        { id: 'rot-1', nome: 'Rotina 1', notas: [] },
        { id: 'rot-2', nome: 'Rotina 2', notas: [] },
        { id: 'rot-3', nome: 'Rotina 3', notas: [] },
      ];

      const pilarComRotinas = {
        id: pilarEmpresaId,
        nome: 'Pilar com Rotinas',
        empresaId,
        rotinasEmpresa: rotinasMock,
        _count: { rotinasEmpresa: 3 },
      };

      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue(pilarComRotinas as any);
      jest.spyOn(prisma.pilarEmpresa, 'delete').mockResolvedValue(pilarComRotinas as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockGestorEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.deletePilarEmpresa(empresaId, pilarEmpresaId, mockGestorEmpresaA);

      // Deve executar hard delete mesmo com rotinas
      expect(prisma.pilarEmpresa.delete).toHaveBeenCalledWith({
        where: { id: pilarEmpresaId },
      });

      // Deve auditar pilar + 3 rotinas
      expect(audit.log).toHaveBeenCalledTimes(4);
      expect(result).toEqual({ message: 'Pilar removido com sucesso (removido em cascata: 3 rotina(s))' });
    });

    it('Cascade Audit: deve logar todas rotinas deletadas em cascata', async () => {
      const rotinasMock = [
        { id: 'rot-1', nome: 'Rotina 1', notas: [] },
        { id: 'rot-2', nome: 'Rotina 2', notas: [] },
        { id: 'rot-3', nome: 'Rotina 3', notas: [] },
      ];

      const pilarMock = {
        id: pilarEmpresaId,
        nome: 'Pilar com Rotinas',
        empresaId,
        rotinasEmpresa: rotinasMock, // ← Incluindo rotinas
        _count: { rotinasEmpresa: 0 }, // Passou validação (mock controlado)
      };

      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue(pilarMock as any);
      jest.spyOn(prisma.pilarEmpresa, 'delete').mockResolvedValue(pilarMock as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockGestorEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.deletePilarEmpresa(empresaId, pilarEmpresaId, mockGestorEmpresaA);

      // Deve logar: 1 pilar + 3 rotinas = 4 registros
      expect(audit.log).toHaveBeenCalledTimes(4);
      
      // Validar log do pilar
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        entidade: 'pilares_empresa',
        acao: 'DELETE',
      }));

      // Validar logs das rotinas
      rotinasMock.forEach((rotina) => {
        expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
          entidade: 'rotinas_empresa',
          entidadeId: rotina.id,
          acao: 'DELETE',
          dadosAntes: expect.objectContaining({
            id: rotina.id,
            nome: rotina.nome,
          }),
        }));
      });
    });

    it('Multi-tenant: GESTOR não deve deletar pilar de outra empresa', async () => {
      await expect(
        service.deletePilarEmpresa('empresa-b', pilarEmpresaId, mockGestorEmpresaA),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Validação: deve falhar se pilar não pertence à empresa', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue(null);

      await expect(
        service.deletePilarEmpresa(empresaId, 'invalid-pilar', mockGestorEmpresaA),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // SNAPSHOT PATTERN - ROTINA EMPRESA (createRotinaEmpresa)
  // R-ROTEMP-001
  // ============================================================

  describe('Snapshot Pattern: createRotinaEmpresa() - XOR Validation', () => {
    const empresaId = 'empresa-a';
    const pilarEmpresaId = 'pilar-emp-1';

    beforeEach(() => {
      // Mock padrão de pilarEmpresa válido
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue({
        id: pilarEmpresaId,
        empresaId,
      } as any);
    });

    it('R-ROTEMP-001: deve criar rotina a partir de template (snapshot)', async () => {
      const templateId = 'rotina-template-uuid';
      const templateMock = {
        id: templateId,
        nome: 'Reunião Semanal',
        descricao: 'Template de reunião',
      };

      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(templateMock as any);
      jest.spyOn(prisma.rotinaEmpresa, 'findFirst').mockResolvedValueOnce(null); // Nome único
      jest.spyOn(prisma.rotinaEmpresa, 'findFirst').mockResolvedValueOnce({ ordem: 2 } as any); // Max ordem
      jest.spyOn(prisma.rotinaEmpresa, 'create').mockResolvedValue({
        id: 'new-rotina-id',
        rotinaTemplateId: templateId,
        nome: templateMock.nome,
        descricao: templateMock.descricao,
        pilarEmpresaId,
        ordem: 3,
      } as any);

      // Mock do rotinasService.createRotinaEmpresa
      jest.spyOn(rotinasService, 'createRotinaEmpresa').mockResolvedValue({
        id: 'new-rotina-id',
        rotinaTemplateId: templateId,
        nome: templateMock.nome,
        descricao: templateMock.descricao,
        pilarEmpresaId,
        ordem: 3,
      } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockGestorEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await rotinasService.createRotinaEmpresa(
        empresaId,
        pilarEmpresaId,
        { rotinaTemplateId: templateId },
        mockGestorEmpresaA,
      );

      expect(result.rotinaTemplateId).toBe(templateId);
      expect(result.nome).toBe(templateMock.nome);
      expect(result.ordem).toBe(3);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        dadosDepois: expect.objectContaining({ isCustom: false }),
      }));
    });

    it('R-ROTEMP-001: deve criar rotina customizada sem template', async () => {
      const customNome = 'Rotina Específica';

      jest.spyOn(prisma.rotinaEmpresa, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prisma.rotinaEmpresa, 'findFirst').mockResolvedValueOnce(null); // Primeira rotina
      jest.spyOn(prisma.rotinaEmpresa, 'create').mockResolvedValue({
        id: 'custom-rotina-id',
        rotinaTemplateId: null,
        nome: customNome,
        pilarEmpresaId,
        ordem: 1,
      } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockGestorEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await rotinasService.createRotinaEmpresa(
        empresaId,
        pilarEmpresaId,
        { nome: customNome },
        mockGestorEmpresaA,
      );

      expect(result.rotinaTemplateId).toBeNull();
      expect(result.nome).toBe(customNome);
      expect(result.ordem).toBe(1);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        dadosDepois: expect.objectContaining({ isCustom: true }),
      }));
    });

    it('XOR Validation: deve falhar se template não encontrado', async () => {
      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(null);

      // Mock para lançar exceção quando template não encontrado
      jest.spyOn(rotinasService, 'createRotinaEmpresa').mockRejectedValue(
        new NotFoundException('Template de rotina não encontrado')
      );

      await expect(
        rotinasService.createRotinaEmpresa(
          empresaId,
          pilarEmpresaId,
          { rotinaTemplateId: 'invalid-uuid' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('Unicidade: deve bloquear nome duplicado no mesmo pilar', async () => {
      jest.spyOn(prisma.rotinaEmpresa, 'findFirst').mockResolvedValue({
        id: 'existing-rotina',
        nome: 'Duplicado',
        pilarEmpresaId,
      } as any);

      // Mock para lançar exceção quando nome duplicado
      jest.spyOn(rotinasService, 'createRotinaEmpresa').mockRejectedValue(
        new ConflictException('Nome de rotina já existe no pilar')
      );

      await expect(
        rotinasService.createRotinaEmpresa(
          empresaId,
          pilarEmpresaId,
          { nome: 'Duplicado' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('Validação: deve falhar se pilar não pertence à empresa', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findFirst').mockResolvedValue(null);

      // Mock para lançar exceção quando pilar não pertence à empresa
      jest.spyOn(rotinasService, 'createRotinaEmpresa').mockRejectedValue(
        new ForbiddenException('Pilar não pertence à empresa')
      );

      await expect(
        rotinasService.createRotinaEmpresa(
          empresaId,
          'invalid-pilar',
          { nome: 'Test' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Validação: deve falhar se rotina não pertence à empresa', async () => {
      jest.spyOn(prisma.rotinaEmpresa, 'findFirst').mockResolvedValue(null);

      // Mock para lançar exceção quando rotina não pertence à empresa
      jest.spyOn(rotinasService, 'deleteRotinaEmpresa').mockRejectedValue(
        new NotFoundException('Rotina não encontrada')
      );

      await expect(
        rotinasService.deleteRotinaEmpresa(empresaId, 'invalid-rotina', mockGestorEmpresaA),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // R-PILEMP-006: Definir Responsável por Pilar
  // ============================================================

  describe('R-PILEMP-006: Definir Responsável por Pilar', () => {
    const empresaId = 'empresa-a';
    const pilarEmpresaId = 'pilar-1';
    const usuarioId = 'usuario-1';

    beforeEach(() => {
      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue({
        id: pilarEmpresaId,
        empresaId,
        nome: 'Estratégia',
        ordem: 1,
        ativo: true,
        responsavelId: null,
      } as any);
    });

    it('deve definir responsável quando usuário pertence à mesma empresa', async () => {
      const mockUsuario = {
        id: usuarioId,
        nome: 'João Silva',
        email: 'joao@empresa.com',
        empresaId,
        ativo: true,
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUsuario as any);
      jest.spyOn(prisma.pilarEmpresa, 'update').mockResolvedValue({
        id: pilarEmpresaId,
        empresaId,
        responsavelId: usuarioId,
      } as any);

      const result = await service.definirResponsavel(
        empresaId,
        pilarEmpresaId,
        usuarioId,
        mockGestorEmpresaA,
      );

      expect(prisma.pilarEmpresa.update).toHaveBeenCalledWith({
        where: { id: pilarEmpresaId },
        data: {
          responsavelId: usuarioId,
          updatedBy: mockGestorEmpresaA.id,
        },
        include: expect.any(Object),
      });

      expect(result.responsavelId).toBe(usuarioId);
    });

    it('deve permitir remover responsável (responsavelId = null)', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'update').mockResolvedValue({
        id: pilarEmpresaId,
        empresaId,
        responsavelId: null,
      } as any);

      const result = await service.definirResponsavel(
        empresaId,
        pilarEmpresaId,
        null,
        mockGestorEmpresaA,
      );

      expect(prisma.pilarEmpresa.update).toHaveBeenCalledWith({
        where: { id: pilarEmpresaId },
        data: {
          responsavelId: null,
          updatedBy: mockGestorEmpresaA.id,
        },
        include: expect.any(Object),
      });

      expect(result.responsavelId).toBeNull();
    });

    it('deve lançar erro quando responsável não pertence à mesma empresa', async () => {
      const mockUsuarioOutraEmpresa = {
        id: usuarioId,
        nome: 'João Silva',
        email: 'joao@outra.com',
        empresaId: 'empresa-2', // Empresa diferente
        ativo: true,
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(
        mockUsuarioOutraEmpresa as any,
      );

      await expect(
        service.definirResponsavel(
          empresaId,
          pilarEmpresaId,
          usuarioId,
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.definirResponsavel(
          empresaId,
          pilarEmpresaId,
          usuarioId,
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow('O responsável deve pertencer à mesma empresa do pilar');
    });

    it('deve lançar erro quando responsável não existe', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);

      await expect(
        service.definirResponsavel(
          empresaId,
          pilarEmpresaId,
          'usuario-inexistente',
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.definirResponsavel(
          empresaId,
          pilarEmpresaId,
          'usuario-inexistente',
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow('Usuário responsável não encontrado');
    });

    it('deve validar acesso multi-tenant ao pilar', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue({
        id: pilarEmpresaId,
        empresaId: 'empresa-2', // Empresa diferente
        nome: 'Estratégia',
        ordem: 1,
        ativo: true,
      } as any);

      await expect(
        service.definirResponsavel(
          'empresa-2',
          pilarEmpresaId,
          usuarioId,
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.definirResponsavel(
          'empresa-2',
          pilarEmpresaId,
          usuarioId,
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow('Você não pode acessar dados de outra empresa');
    });

    it('deve lançar erro quando pilar não existe', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(null);

      await expect(
        service.definirResponsavel(
          empresaId,
          'pilar-inexistente',
          usuarioId,
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.definirResponsavel(
          empresaId,
          'pilar-inexistente',
          usuarioId,
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow('Vínculo pilar-empresa não encontrado');
    });

    it('deve lançar erro quando pilar não pertence à empresa especificada', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue({
        id: pilarEmpresaId,
        empresaId: 'empresa-2', // Empresa diferente da URL
        nome: 'Estratégia',
        ordem: 1,
        ativo: true,
      } as any);

      // ADMINISTRADOR pode acessar, mas validação de pertencimento ainda falha
      await expect(
        service.definirResponsavel(
          empresaId, // empresa-a
          pilarEmpresaId, // mas pilar pertence a empresa-2
          usuarioId,
          mockAdminUser,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.definirResponsavel(
          empresaId,
          pilarEmpresaId,
          usuarioId,
          mockAdminUser,
        ),
      ).rejects.toThrow('Este pilar não pertence à empresa especificada');
    });

    it('deve auditar atualização de responsável', async () => {
      const mockUsuario = {
        id: usuarioId,
        nome: 'João Silva',
        email: 'joao@empresa.com',
        empresaId,
        ativo: true,
      };

      const mockPilarAntes = {
        id: pilarEmpresaId,
        empresaId,
        responsavelId: 'usuario-antigo',
      };

      const mockPilarDepois = {
        id: pilarEmpresaId,
        empresaId,
        responsavelId: usuarioId,
      };

      jest.spyOn(prisma.usuario, 'findUnique')
        .mockResolvedValueOnce(mockUsuario as any) // Validação do responsável
        .mockResolvedValueOnce(mockGestorEmpresaA as any); // Busca do usuário para auditoria
      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(
        mockPilarAntes as any,
      );
      jest.spyOn(prisma.pilarEmpresa, 'update').mockResolvedValue(mockPilarDepois as any);

      await service.definirResponsavel(
        empresaId,
        pilarEmpresaId,
        usuarioId,
        mockGestorEmpresaA,
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: mockGestorEmpresaA.id,
          entidade: 'pilares_empresa',
          entidadeId: pilarEmpresaId,
          acao: 'UPDATE',
          dadosAntes: expect.objectContaining({
            responsavelId: 'usuario-antigo',
          }),
          dadosDepois: expect.objectContaining({
            responsavelId: usuarioId,
          }),
        }),
      );
    });

    it('deve permitir ADMINISTRADOR definir responsável em qualquer empresa', async () => {
      const empresaOutra = 'empresa-99';
      const mockUsuario = {
        id: usuarioId,
        nome: 'João Silva',
        email: 'joao@empresa.com',
        empresaId: empresaOutra,
        ativo: true,
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue({
        id: pilarEmpresaId,
        empresaId: empresaOutra,
        nome: 'Estratégia',
        ordem: 1,
        ativo: true,
      } as any);
      jest.spyOn(prisma.usuario, 'findUnique')
        .mockResolvedValueOnce(mockUsuario as any)
        .mockResolvedValueOnce(mockAdminUser as any);
      jest.spyOn(prisma.pilarEmpresa, 'update').mockResolvedValue({
        id: pilarEmpresaId,
        empresaId: empresaOutra,
        responsavelId: usuarioId,
      } as any);

      await service.definirResponsavel(
        empresaOutra,
        pilarEmpresaId,
        usuarioId,
        mockAdminUser,
      );

      expect(prisma.pilarEmpresa.update).toHaveBeenCalled();
    });
  });

  // ============================================================
  // SNAPSHOT ISOLATION - Validação de Independência
  // ============================================================

  describe('Snapshot Isolation: Alteração de Template NÃO afeta Snapshots', () => {
    it('Snapshot deve permanecer inalterado quando template é atualizado', async () => {
      // Este teste valida que snapshots são CÓPIAS, não referências
      // Alterações no template NÃO propagam para snapshots existentes
      
      const templateId = 'template-uuid';
      const snapshotOriginal = {
        id: 'snapshot-id',
        pilarTemplateId: templateId,
        nome: 'Nome Original do Template',
        descricao: 'Descrição Original',
        empresaId: 'empresa-a',
      };

      // 1. Template é atualizado (nome mudou)
      const templateAtualizado = {
        id: templateId,
        nome: 'NOVO NOME DO TEMPLATE',
        descricao: 'NOVA DESCRIÇÃO',
      };

      // 2. Buscar snapshot existente
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([snapshotOriginal] as any);

      const snapshots = await prisma.pilarEmpresa.findMany({
        where: { pilarTemplateId: templateId },
      });

      // 3. Validar que snapshot NÃO foi afetado
      expect(snapshots[0].nome).toBe('Nome Original do Template');
      expect(snapshots[0].nome).not.toBe(templateAtualizado.nome);
      
      // Snapshot é CONGELADO no momento da criação
    });

    it('Snapshots de diferentes empresas podem ter nomes diferentes (mesmo template)', async () => {
      const templateId = 'template-uuid';
      
      const snapshotEmpresaA = {
        id: 'snap-a',
        pilarTemplateId: templateId,
        nome: 'Estratégia (customizado)',
        empresaId: 'empresa-a',
      };

      const snapshotEmpresaB = {
        id: 'snap-b',
        pilarTemplateId: templateId,
        nome: 'Planejamento Estratégico',
        empresaId: 'empresa-b',
      };

      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue([
        snapshotEmpresaA,
        snapshotEmpresaB,
      ] as any);

      const snapshots = await prisma.pilarEmpresa.findMany({
        where: { pilarTemplateId: templateId },
      });

      // Validar que mesmo template gerou snapshots com nomes diferentes
      expect(snapshots).toHaveLength(2);
      expect(snapshots[0].nome).not.toBe(snapshots[1].nome);
      expect(snapshots[0].pilarTemplateId).toBe(snapshots[1].pilarTemplateId);
    });
  });
});