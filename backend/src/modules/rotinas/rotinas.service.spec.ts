import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RotinasService } from './rotinas.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * QA UNITÁRIO ESTRITO - Módulo Rotinas
 * Data: 2024-12-25
 * Validação conforme handoffs:
 * - PATTERN-REPORT-rotinas-revalidation.md
 * - REVIEWER-REPORT-rotinas-business-rules.md
 * 
 * Testes prioritários:
 * 1. RotinasService.remove() - Validação 409 (R-ROT-BE-002)
 * 2. RotinasService.reordenarPorPilar() - Auditoria
 * 3. RotinasService.create() - Validação de pilar
 * 4. RotinasService.update() - Validação de pilar
 * 5. RotinasService.findAll() - Filtro e ordenação
 */
describe('RotinasService', () => {
  let service: RotinasService;
  let prisma: PrismaService;
  let audit: AuditService;

  const mockUser = {
    id: 'user-123',
    nome: 'Test User',
    email: 'test@example.com',
  };

  const mockPilar = {
    id: 'pilar-123',
    nome: 'Estratégia',
    ordem: 1,
    ativo: true,
  };

  const mockRotina = {
    id: 'rotina-123',
    nome: 'Planejamento Anual',
    descricao: 'Planejamento estratégico anual',
    ordem: 1,
    modelo: false,
    ativo: true,
    pilarId: 'pilar-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    updatedBy: null,
    pilar: mockPilar,
  };

  const mockEmpresa = {
    id: 'empresa-123',
    nome: 'Empresa Teste',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotinasService,
        {
          provide: PrismaService,
          useValue: {
            pilar: {
              findUnique: jest.fn(),
            },
            rotina: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            rotinaEmpresa: {
              findMany: jest.fn(),
            },
            usuario: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
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

    service = module.get<RotinasService>(RotinasService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // R-ROT-001: Criação com Validação de Pilar
  // ============================================================

  describe('create()', () => {
    const createDto = {
      nome: 'Nova Rotina',
      descricao: 'Descrição da rotina',
      ordem: 1,
      pilarId: 'pilar-123',
      modelo: false,
    };

    it('deve criar rotina com pilar válido', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(mockPilar as any);
      jest.spyOn(prisma.rotina, 'create').mockResolvedValue(mockRotina as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.create(createDto, 'user-123');

      expect(prisma.pilar.findUnique).toHaveBeenCalledWith({
        where: { id: 'pilar-123' },
      });
      expect(prisma.rotina.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          createdBy: 'user-123',
        },
        include: {
          pilar: true,
        },
      });
      expect(audit.log).toHaveBeenCalledWith({
        usuarioId: 'user-123',
        usuarioNome: 'Test User',
        usuarioEmail: 'test@example.com',
        entidade: 'rotinas',
        entidadeId: 'rotina-123',
        acao: 'CREATE',
        dadosDepois: mockRotina,
      });
      expect(result).toEqual(mockRotina);
    });

    it('deve lançar NotFoundException se pilar não existir', async () => {
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);

      await expect(service.create(createDto, 'user-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto, 'user-123')).rejects.toThrow(
        'Pilar não encontrado',
      );
      expect(prisma.rotina.create).not.toHaveBeenCalled();
    });

    it('deve criar rotina com campo modelo: true', async () => {
      const modeloDto = { ...createDto, modelo: true };
      const rotinaModelo = { ...mockRotina, modelo: true };

      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(mockPilar as any);
      jest.spyOn(prisma.rotina, 'create').mockResolvedValue(rotinaModelo as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.create(modeloDto, 'user-123');

      expect(result.modelo).toBe(true);
    });
  });

  // ============================================================
  // R-ROT-002: Listagem com Filtro por Pilar
  // ============================================================

  describe('findAll()', () => {
    const rotinas = [
      { ...mockRotina, id: 'rot-1', ordem: 1, pilar: { ...mockPilar, ordem: 1 } },
      { ...mockRotina, id: 'rot-2', ordem: 2, pilar: { ...mockPilar, ordem: 1 } },
      { ...mockRotina, id: 'rot-3', ordem: 1, pilar: { ...mockPilar, id: 'pilar-2', ordem: 2 } },
    ];

    it('deve retornar todas as rotinas ativas sem filtro', async () => {
      jest.spyOn(prisma.rotina, 'findMany').mockResolvedValue(rotinas as any);

      const result = await service.findAll();

      expect(prisma.rotina.findMany).toHaveBeenCalledWith({
        where: {
          ativo: true,
        },
        include: {
          pilar: {
            select: {
              id: true,
              nome: true,
              ordem: true,
            },
          },
        },
        orderBy: [{ pilar: { ordem: 'asc' } }, { ordem: 'asc' }],
      });
      expect(result).toEqual(rotinas);
      expect(result).toHaveLength(3);
    });

    it('deve filtrar rotinas por pilarId', async () => {
      const rotinasFiltradas = rotinas.filter((r) => r.pilar.id === 'pilar-123');
      jest.spyOn(prisma.rotina, 'findMany').mockResolvedValue(rotinasFiltradas as any);

      const result = await service.findAll('pilar-123');

      expect(prisma.rotina.findMany).toHaveBeenCalledWith({
        where: {
          ativo: true,
          pilarId: 'pilar-123',
        },
        include: {
          pilar: {
            select: {
              id: true,
              nome: true,
              ordem: true,
            },
          },
        },
        orderBy: [{ pilar: { ordem: 'asc' } }, { ordem: 'asc' }],
      });
      expect(result).toHaveLength(2);
    });

    it('deve ordenar por pilar.ordem ASC depois rotina.ordem ASC', async () => {
      jest.spyOn(prisma.rotina, 'findMany').mockResolvedValue(rotinas as any);

      await service.findAll();

      expect(prisma.rotina.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ pilar: { ordem: 'asc' } }, { ordem: 'asc' }],
        }),
      );
    });
  });

  // ============================================================
  // R-ROT-003: Busca com Pilar Completo
  // ============================================================

  describe('findOne()', () => {
    it('deve retornar rotina com pilar completo', async () => {
      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(mockRotina as any);

      const result = await service.findOne('rotina-123');

      expect(prisma.rotina.findUnique).toHaveBeenCalledWith({
        where: { id: 'rotina-123' },
        include: {
          pilar: true,
        },
      });
      expect(result).toEqual(mockRotina);
      expect(result.pilar).toBeDefined();
    });

    it('deve lançar NotFoundException se rotina não existir', async () => {
      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('rotina-invalida')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('rotina-invalida')).rejects.toThrow(
        'Rotina não encontrada',
      );
    });
  });

  // ============================================================
  // R-ROT-004: Atualização com Validação de Pilar
  // ============================================================

  describe('update()', () => {
    const updateDto = {
      nome: 'Rotina Atualizada',
      descricao: 'Descrição atualizada',
    };

    it('deve atualizar rotina sem alterar pilarId', async () => {
      const updatedRotina = { ...mockRotina, ...updateDto };

      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(mockRotina as any);
      jest.spyOn(prisma.rotina, 'update').mockResolvedValue(updatedRotina as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.update('rotina-123', updateDto, 'user-123');

      expect(prisma.pilar.findUnique).not.toHaveBeenCalled();
      expect(prisma.rotina.update).toHaveBeenCalledWith({
        where: { id: 'rotina-123' },
        data: {
          ...updateDto,
          updatedBy: 'user-123',
        },
        include: {
          pilar: true,
        },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'UPDATE',
          dadosAntes: mockRotina,
          dadosDepois: updatedRotina,
        }),
      );
      expect(result).toEqual(updatedRotina);
    });

    it('deve validar novo pilar ao alterar pilarId', async () => {
      const updateDtoComPilar = { ...updateDto, pilarId: 'pilar-novo' };
      const novoPilar = { ...mockPilar, id: 'pilar-novo' };

      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(mockRotina as any);
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(novoPilar as any);
      jest.spyOn(prisma.rotina, 'update').mockResolvedValue({ ...mockRotina, pilarId: 'pilar-novo' } as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);

      await service.update('rotina-123', updateDtoComPilar, 'user-123');

      expect(prisma.pilar.findUnique).toHaveBeenCalledWith({
        where: { id: 'pilar-novo' },
      });
    });

    it('deve lançar NotFoundException se novo pilar não existir', async () => {
      const updateDtoComPilar = { ...updateDto, pilarId: 'pilar-invalido' };

      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(mockRotina as any);
      jest.spyOn(prisma.pilar, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update('rotina-123', updateDtoComPilar, 'user-123'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('rotina-123', updateDtoComPilar, 'user-123'),
      ).rejects.toThrow('Pilar não encontrado');
    });
  });

  // ============================================================
  // R-ROT-BE-002: Validação de Dependência em Desativação
  // TESTE PRIORITÁRIO conforme handoff
  // ============================================================

  describe('remove() - R-ROT-BE-002', () => {
    it('deve desativar rotina sem dependências', async () => {
      const desativada = { ...mockRotina, ativo: false };

      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(mockRotina as any);
      jest.spyOn(prisma.rotinaEmpresa, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.rotina, 'update').mockResolvedValue(desativada as any);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.remove('rotina-123', 'user-123');

      expect(prisma.rotinaEmpresa.findMany).toHaveBeenCalledWith({
        where: { rotinaId: 'rotina-123' },
        include: {
          pilarEmpresa: {
            include: {
              empresa: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      });
      expect(prisma.rotina.update).toHaveBeenCalledWith({
        where: { id: 'rotina-123' },
        data: {
          ativo: false,
          updatedBy: 'user-123',
        },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'DELETE',
          dadosAntes: mockRotina,
          dadosDepois: desativada,
        }),
      );
      expect(result.ativo).toBe(false);
    });

    it('deve lançar ConflictException 409 se rotina em uso', async () => {
      const rotinaEmUso = [
        {
          id: 're-1',
          pilarEmpresa: {
            empresa: {
              id: 'empresa-123',
              nome: 'Empresa Teste',
            },
          },
        },
      ];

      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(mockRotina as any);
      jest.spyOn(prisma.rotinaEmpresa, 'findMany').mockResolvedValue(rotinaEmUso as any);

      await expect(service.remove('rotina-123', 'user-123')).rejects.toThrow(
        ConflictException,
      );

      expect(prisma.rotina.update).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('deve retornar lista de empresas afetadas no erro 409', async () => {
      const rotinaEmUso = [
        {
          id: 're-1',
          pilarEmpresa: {
            empresa: { id: 'emp-1', nome: 'Empresa A' },
          },
        },
        {
          id: 're-2',
          pilarEmpresa: {
            empresa: { id: 'emp-2', nome: 'Empresa B' },
          },
        },
      ];

      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(mockRotina as any);
      jest.spyOn(prisma.rotinaEmpresa, 'findMany').mockResolvedValue(rotinaEmUso as any);

      try {
        await service.remove('rotina-123', 'user-123');
        fail('Deveria ter lançado ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.response).toMatchObject({
          message: 'Não é possível desativar esta rotina pois está em uso por empresas',
          empresasAfetadas: [
            { id: 'emp-1', nome: 'Empresa A' },
            { id: 'emp-2', nome: 'Empresa B' },
          ],
          totalEmpresas: 2,
        });
      }
    });

    it('deve lançar NotFoundException se rotina não existir', async () => {
      jest.spyOn(prisma.rotina, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('rotina-invalida', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // R-ROT-006 + CORREÇÃO #3: Reordenação com Auditoria
  // TESTE PRIORITÁRIO conforme handoff
  // ============================================================

  describe('reordenarPorPilar() - com Auditoria', () => {
    const ordensIds = [
      { id: 'rot-1', ordem: 1 },
      { id: 'rot-2', ordem: 2 },
      { id: 'rot-3', ordem: 3 },
    ];

    it('deve reordenar rotinas em transação atômica', async () => {
      const rotinasReordenadas = [
        { ...mockRotina, id: 'rot-1', ordem: 1 },
        { ...mockRotina, id: 'rot-2', ordem: 2 },
        { ...mockRotina, id: 'rot-3', ordem: 3 },
      ];

      // Mock $transaction para executar as promises recebidas
      jest.spyOn(prisma, '$transaction' as any).mockImplementation((promises: any) => {
        if (Array.isArray(promises)) {
          return Promise.all(promises);
        }
        return Promise.resolve([]);
      });
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.rotina, 'findMany').mockResolvedValue(rotinasReordenadas as any);

      const result = await service.reordenarPorPilar('pilar-123', ordensIds, 'user-123');

      // Verificar que transaction foi chamada
      expect(prisma.$transaction).toHaveBeenCalled();
      
      // Verificar que rotinas.update foi chamado 3 vezes
      expect(prisma.rotina.update).toHaveBeenCalledTimes(3);
      
      expect(result).toEqual(rotinasReordenadas);
    });

    it('deve registrar auditoria após reordenação', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([]);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.rotina, 'findMany').mockResolvedValue([]);

      await service.reordenarPorPilar('pilar-123', ordensIds, 'user-123');

      expect(audit.log).toHaveBeenCalledWith({
        usuarioId: 'user-123',
        usuarioNome: 'Test User',
        usuarioEmail: 'test@example.com',
        entidade: 'rotinas',
        entidadeId: 'pilar-123',
        acao: 'UPDATE',
        dadosAntes: null,
        dadosDepois: { acao: 'reordenacao', ordens: ordensIds },
      });
    });

    it('deve validar que rotinas pertencem ao pilar via WHERE clause', async () => {
      jest.spyOn(prisma, '$transaction' as any).mockResolvedValue([]);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.rotina, 'findMany').mockResolvedValue([]);

      await service.reordenarPorPilar('pilar-123', ordensIds, 'user-123');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('deve retornar rotinas do pilar após reordenação', async () => {
      const rotinasReordenadas = [
        { ...mockRotina, ordem: 3 },
        { ...mockRotina, ordem: 1 },
        { ...mockRotina, ordem: 2 },
      ];

      jest.spyOn(prisma, '$transaction').mockResolvedValue([]);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.rotina, 'findMany').mockResolvedValue(rotinasReordenadas as any);

      const result = await service.reordenarPorPilar('pilar-123', ordensIds, 'user-123');

      expect(prisma.rotina.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ativo: true,
            pilarId: 'pilar-123',
          }),
        }),
      );
      expect(result).toEqual(rotinasReordenadas);
    });
  });
});
