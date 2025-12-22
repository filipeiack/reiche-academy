import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PilaresService } from './pilares.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * QA UNITÁRIO ESTRITO - Módulo Pilares
 * Recriado após deleção acidental pelo DEV
 * Valida GAP-1, GAP-2 e todas as regras de /docs/business-rules/pilares.md
 */
describe('PilaresService', () => {
  let service: PilaresService;
  let prisma: PrismaService;
  let audit: AuditService;

  const mockAdminUser = {
    id: 'admin-id',
    email: 'admin@test.com',
    nome: 'Admin User',
    perfil: { codigo: 'ADMINISTRADOR', nivel: 1 },
  };

  const mockPilarPadrao = {
    id: 'pilar-1',
    nome: 'Estratégia',
    descricao: 'Pilar estratégico',
    ordem: 1,
    modelo: true,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    _count: { rotinas: 0, empresas: 3 },
  };

  const mockPilarCustomizado = {
    id: 'pilar-2',
    nome: 'Inovação',
    descricao: 'Pilar customizado',
    ordem: null,
    modelo: false,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    _count: { rotinas: 2, empresas: 1 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PilaresService,
        {
          provide: PrismaService,
          useValue: {
            pilar: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            rotina: {
              count: jest.fn(),
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

    service = module.get<PilaresService>(PilaresService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // GAP-1: Campo modelo em CreatePilarDto
  // ============================================================

  describe('GAP-1: Campo modelo em criação', () => {
    it('deve criar pilar com modelo: true', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'create').mockResolvedValue(mockPilarPadrao as any);

      const result = await service.create(
        { nome: 'Estratégia', descricao: 'Pilar estratégico', modelo: true, ordem: 1 },
        'admin-id',
      );

      expect(result.modelo).toBe(true);
      expect(prisma.pilar.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            modelo: true,
          }),
        }),
      );
    });

    it('deve criar pilar com modelo: false (default)', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'create').mockResolvedValue(mockPilarCustomizado as any);

      const result = await service.create(
        { nome: 'Inovação', modelo: false },
        'admin-id',
      );

      expect(result.modelo).toBe(false);
    });

    it('deve criar pilar sem campo modelo (opcional)', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'create').mockResolvedValue({ ...mockPilarCustomizado, modelo: false } as any);

      const result = await service.create(
        { nome: 'Outro Pilar' },
        'admin-id',
      );

      expect(prisma.pilar.create).toHaveBeenCalled();
    });
  });

  // ============================================================
  // GAP-2: Campo modelo em UpdatePilarDto
  // ============================================================

  describe('GAP-2: Campo modelo em atualização', () => {
    it('deve atualizar pilar de modelo: false → true', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarCustomizado as any);
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'update').mockResolvedValue({ ...mockPilarCustomizado, modelo: true } as any);

      const result = await service.update(
        'pilar-2',
        { modelo: true },
        'admin-id',
      );

      expect(result.modelo).toBe(true);
      expect(prisma.pilar.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            modelo: true,
          }),
        }),
      );
    });

    it('deve atualizar pilar de modelo: true → false', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarPadrao as any);
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'update').mockResolvedValue({ ...mockPilarPadrao, modelo: false } as any);

      const result = await service.update(
        'pilar-1',
        { modelo: false },
        'admin-id',
      );

      expect(result.modelo).toBe(false);
    });
  });

  // ============================================================
  // R-PIL-001: Unicidade de nome
  // ============================================================

  describe('R-PIL-001: Unicidade de nome', () => {
    it('deve bloquear criação com nome duplicado', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(mockPilarPadrao as any);

      await expect(
        service.create(
          { nome: 'Estratégia' },
          'admin-id',
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.pilar.create).not.toHaveBeenCalled();
    });

    it('deve permitir criação com nome único', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'create').mockResolvedValue(mockPilarPadrao as any);

      const result = await service.create(
        { nome: 'Novo Pilar Único' },
        'admin-id',
      );

      expect(result).toBeDefined();
      expect(prisma.pilar.create).toHaveBeenCalled();
    });
  });

  // ============================================================
  // R-PIL-002: Listagem de ativos
  // ============================================================

  describe('R-PIL-002: Listagem de ativos', () => {
    it('deve retornar apenas pilares ativos', async () => {
      const mockPilares = [mockPilarPadrao, mockPilarCustomizado];
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue(mockPilares as any);

      const result = await service.findAll();

      expect(result).toEqual(mockPilares);
      expect(prisma.pilar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ativo: true },
        }),
      );
    });

    it('deve incluir contadores _count.rotinas e _count.empresas', async () => {
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([mockPilarPadrao] as any);

      const result = await service.findAll();

      expect(result[0]._count).toBeDefined();
      expect(result[0]._count.rotinas).toBe(0);
      expect(result[0]._count.empresas).toBe(3);
    });

    it('não deve retornar pilares inativos', async () => {
      jest.spyOn(prisma.pilar, 'findMany').mockResolvedValue([]);

      await service.findAll();

      expect(prisma.pilar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ativo: true },
        }),
      );
    });
  });

  // ============================================================
  // R-PIL-003: Busca por ID
  // ============================================================

  describe('R-PIL-003: Busca por ID', () => {
    it('deve retornar pilar com rotinas ativas', async () => {
      const pilarComRotinas = {
        ...mockPilarPadrao,
        rotinas: [
          { id: 'rotina-1', nome: 'Rotina 1', ativo: true },
          { id: 'rotina-2', nome: 'Rotina 2', ativo: true },
        ],
        empresas: [],
      };
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(pilarComRotinas as any);

      const result = await service.findOne('pilar-1');

      expect(result.rotinas).toHaveLength(2);
      expect(prisma.pilar.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'pilar-1',
            ativo: true,
          }),
        }),
      );
    });

    it('deve filtrar rotinas inativas', async () => {
      const pilarComRotinas = {
        ...mockPilarPadrao,
        rotinas: [
          { id: 'rotina-1', nome: 'Rotina Ativa', ativo: true },
        ],
        empresas: [],
      };
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(pilarComRotinas as any);

      const result = await service.findOne('pilar-1');

      expect(result.rotinas.every(r => r.ativo)).toBe(true);
    });

    it('deve lançar NotFoundException se pilar não existir', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('pilar-inexistente')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se pilar estiver inativo', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('pilar-inativo')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // R-PIL-004: Atualização com validação de nome
  // ============================================================

  describe('R-PIL-004: Atualização de pilar', () => {
    it('deve atualizar pilar com nome único', async () => {
      jest.spyOn(prisma.pilar, 'findFirst')
        .mockResolvedValueOnce(mockPilarPadrao as any) // findOne
        .mockResolvedValueOnce(null); // validação nome único (id: not)
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'update').mockResolvedValue({ ...mockPilarPadrao, nome: 'Estratégia Atualizada' } as any);

      const result = await service.update(
        'pilar-1',
        { nome: 'Estratégia Atualizada' },
        'admin-id',
      );

      expect(result.nome).toBe('Estratégia Atualizada');
    });

    it('deve bloquear atualização com nome duplicado', async () => {
      jest.spyOn(prisma.pilar, 'findFirst')
        .mockResolvedValueOnce(mockPilarCustomizado as any) // findOne
        .mockResolvedValueOnce(mockPilarPadrao as any); // nome já existe (outro pilar)

      await expect(
        service.update(
          'pilar-2',
          { nome: 'Estratégia' },
          'admin-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('não deve validar nome se não fornecido', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarPadrao as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'update').mockResolvedValue(mockPilarPadrao as any);

      await service.update(
        'pilar-1',
        { descricao: 'Nova descrição' },
        'admin-id',
      );

      expect(prisma.pilar.findUnique).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // R-PIL-005: Soft delete
  // ============================================================

  describe('R-PIL-005: Soft delete', () => {
    it('deve desativar pilar sem rotinas ativas', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarPadrao as any);
      jest.spyOn(prisma.rotina, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'update').mockResolvedValue({ ...mockPilarPadrao, ativo: false } as any);

      const result = await service.remove('pilar-1', 'admin-id');

      expect(result.ativo).toBe(false);
      expect(prisma.pilar.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ativo: false,
          }),
        }),
      );
    });

    it('deve bloquear desativação se pilar tiver rotinas ativas', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarCustomizado as any);
      jest.spyOn(prisma.rotina, 'count').mockResolvedValue(5);

      await expect(
        service.remove('pilar-2', 'admin-id'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.pilar.update).not.toHaveBeenCalled();
    });

    it('deve permitir desativação se rotinas estiverem inativas', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarCustomizado as any);
      jest.spyOn(prisma.rotina, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'update').mockResolvedValue({ ...mockPilarCustomizado, ativo: false } as any);

      const result = await service.remove('pilar-2', 'admin-id');

      expect(result.ativo).toBe(false);
      expect(prisma.rotina.count).toHaveBeenCalledWith({
        where: {
          pilarId: 'pilar-2',
          ativo: true,
        },
      });
    });
  });

  // ============================================================
  // RA-PIL-001: Bloqueio por rotinas ativas
  // ============================================================

  describe('RA-PIL-001: Bloqueio por rotinas ativas', () => {
    it('deve lançar ConflictException com mensagem clara', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarCustomizado as any);
      jest.spyOn(prisma.rotina, 'count').mockResolvedValue(3);

      await expect(
        service.remove('pilar-2', 'admin-id'),
      ).rejects.toThrow('Não é possível desativar um pilar que possui rotinas ativas');
    });

    it('deve contar apenas rotinas ativas', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarPadrao as any);
      jest.spyOn(prisma.rotina, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'update').mockResolvedValue({ ...mockPilarPadrao, ativo: false } as any);

      await service.remove('pilar-1', 'admin-id');

      expect(prisma.rotina.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ativo: true,
          }),
        }),
      );
    });
  });

  // ============================================================
  // RA-PIL-003: Auditoria completa
  // ============================================================

  describe('RA-PIL-003: Auditoria completa', () => {
    it('deve auditar criação de pilar (CREATE)', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'create').mockResolvedValue(mockPilarPadrao as any);

      await service.create(
        { nome: 'Novo Pilar' },
        'admin-id',
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-id',
          usuarioNome: 'Admin User',
          usuarioEmail: 'admin@test.com',
          entidade: 'pilares',
          entidadeId: 'pilar-1',
          acao: 'CREATE',
          dadosDepois: expect.any(Object),
        }),
      );
    });

    it('deve auditar atualização de pilar (UPDATE)', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarPadrao as any);
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'update').mockResolvedValue(mockPilarPadrao as any);

      await service.update(
        'pilar-1',
        { descricao: 'Atualizado' },
        'admin-id',
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'UPDATE',
        }),
      );
    });

    it('deve auditar desativação de pilar (DELETE)', async () => {
      jest.spyOn(prisma.pilar, 'findFirst').mockResolvedValue(mockPilarPadrao as any);
      jest.spyOn(prisma.rotina, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'update').mockResolvedValue({ ...mockPilarPadrao, ativo: false } as any);

      await service.remove('pilar-1', 'admin-id');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'DELETE',
        }),
      );
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('deve permitir criar pilar com ordem undefined (customizado)', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'create').mockResolvedValue({ ...mockPilarCustomizado, ordem: null } as any);

      const result = await service.create(
        { nome: 'Pilar sem ordem' },
        'admin-id',
      );

      expect(result.ordem).toBeNull();
    });

    it('deve permitir ordem >= 1', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'create').mockResolvedValue({ ...mockPilarPadrao, ordem: 5 } as any);

      const result = await service.create(
        { nome: 'Pilar ordem 5', ordem: 5 },
        'admin-id',
      );

      expect(result.ordem).toBeGreaterThanOrEqual(1);
    });

    it('deve preservar auditoria (createdBy, updatedBy)', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.pilar, 'create').mockResolvedValue(mockPilarPadrao as any);

      await service.create(
        { nome: 'Novo pilar' },
        'admin-id',
      );

      expect(prisma.pilar.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: 'admin-id',
          }),
        }),
      );
    });
  });
});
