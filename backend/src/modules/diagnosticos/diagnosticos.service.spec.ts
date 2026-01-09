import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DiagnosticosService } from './diagnosticos.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';

// Enum de Criticidade (conforme DTO)
enum Criticidade {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAIXO = 'BAIXO',
}

/**
 * QA UNITÁRIO ESTRITO - DiagnosticosService
 * Valida regras críticas de /docs/business-rules/diagnosticos.md
 * 
 * REGRAS CRÍTICAS PROTEGIDAS:
 * - R-DIAG-001: Validação multi-tenant em busca de diagnóstico
 * - RA-DIAG-001: Auditoria completa de notas (CREATE e UPDATE)
 * - R-DIAG-002: Upsert de nota com auto-save
 * - R-DIAG-003: Validação multi-tenant em upsert de nota
 * 
 * Criado de forma independente da implementação.
 */
describe('DiagnosticosService - Validação Completa de Regras de Negócio', () => {
  let service: DiagnosticosService;
  let prisma: PrismaService;
  let audit: AuditService;

  const mockAdminUser: RequestUser = {
    id: 'admin-id',
    email: 'admin@test.com',
    nome: 'Admin User',
    empresaId: null,
    perfil: { codigo: 'ADMINISTRADOR', nivel: 1 },
  };

  const mockGestorEmpresaA: RequestUser = {
    id: 'gestor-a-id',
    email: 'gestor-a@test.com',
    nome: 'Gestor A',
    empresaId: 'empresa-a-id',
    perfil: { codigo: 'GESTOR', nivel: 2 },
  };

  const mockGestorEmpresaB: RequestUser = {
    id: 'gestor-b-id',
    email: 'gestor-b@test.com',
    nome: 'Gestor B',
    empresaId: 'empresa-b-id',
    perfil: { codigo: 'GESTOR', nivel: 2 },
  };

  const mockColaboradorEmpresaA: RequestUser = {
    id: 'colab-a-id',
    email: 'colab-a@test.com',
    nome: 'Colaborador A',
    empresaId: 'empresa-a-id',
    perfil: { codigo: 'COLABORADOR', nivel: 3 },
  };

  const mockPilarEmpresaList = [
    {
      id: 'pilar-emp-1',
      empresaId: 'empresa-a-id',
      pilarTemplateId: 'template-1',
      nome: 'Estratégia',
      ordem: 1,
      ativo: true,
      responsavel: {
        id: 'gestor-a-id',
        nome: 'Gestor A',
        email: 'gestor-a@test.com',
        cargo: 'Gestor',
      },
      rotinasEmpresa: [
        {
          id: 'rotina-emp-1',
          nome: 'Reunião Semanal',
          ordem: 1,
          ativo: true,
          notas: [
            {
              id: 'nota-1',
              rotinaEmpresaId: 'rotina-emp-1',
              nota: 8,
              criticidade: Criticidade.ALTO,
              createdAt: new Date('2025-01-01'),
            },
          ],
        },
        {
          id: 'rotina-emp-2',
          nome: 'Review Trimestral',
          ordem: 2,
          ativo: true,
          notas: [],
        },
      ],
    },
    {
      id: 'pilar-emp-2',
      empresaId: 'empresa-a-id',
      pilarTemplateId: 'template-2',
      nome: 'Marketing',
      ordem: 2,
      ativo: true,
      responsavel: null,
      rotinasEmpresa: [
        {
          id: 'rotina-emp-3',
          nome: 'Análise de Métricas',
          ordem: 1,
          ativo: true,
          notas: [
            {
              id: 'nota-2',
              rotinaEmpresaId: 'rotina-emp-3',
              nota: 6,
              criticidade: Criticidade.MEDIO,
              createdAt: new Date('2025-01-02'),
            },
          ],
        },
      ],
    },
  ];

  const mockRotinaEmpresaA = {
    id: 'rotina-emp-1',
    pilarEmpresa: {
      empresaId: 'empresa-a-id',
    },
  };

  const mockRotinaEmpresaB = {
    id: 'rotina-emp-99',
    pilarEmpresa: {
      empresaId: 'empresa-b-id',
    },
  };

  const mockNotaExistente = {
    id: 'nota-1',
    rotinaEmpresaId: 'rotina-emp-1',
    nota: 8,
    criticidade: Criticidade.ALTO,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdBy: 'gestor-a-id',
    updatedBy: 'gestor-a-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiagnosticosService,
        {
          provide: PrismaService,
          useValue: {
            pilarEmpresa: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            rotinaEmpresa: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            notaRotina: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            pilarEvolucao: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
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

    service = module.get<DiagnosticosService>(DiagnosticosService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // R-DIAG-001: Buscar Estrutura Completa de Diagnóstico
  // Validação Multi-Tenant CRÍTICA
  // ============================================================

  describe('R-DIAG-001: Buscar estrutura completa de diagnóstico com validação multi-tenant', () => {
    it('deve permitir ADMINISTRADOR acessar diagnóstico de qualquer empresa', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      const result = await service.getDiagnosticoByEmpresa('empresa-a-id', mockAdminUser);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('pilar-emp-1');
      expect(result[0].rotinasEmpresa).toHaveLength(2);
      expect(result[0].rotinasEmpresa[0].notas).toHaveLength(1);

      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalledWith({
        where: {
          empresaId: 'empresa-a-id',
          ativo: true,
        },
        include: expect.objectContaining({
          responsavel: expect.any(Object),
          rotinasEmpresa: expect.any(Object),
        }),
        orderBy: { ordem: 'asc' },
      });
    });

    it('deve permitir GESTOR acessar diagnóstico da própria empresa', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      const result = await service.getDiagnosticoByEmpresa('empresa-a-id', mockGestorEmpresaA);

      expect(result).toHaveLength(2);
      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalled();
    });

    it('deve permitir COLABORADOR acessar diagnóstico da própria empresa', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      const result = await service.getDiagnosticoByEmpresa('empresa-a-id', mockColaboradorEmpresaA);

      expect(result).toHaveLength(2);
      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalled();
    });

    it('deve BLOQUEAR GESTOR de acessar diagnóstico de outra empresa (multi-tenant)', async () => {
      await expect(
        service.getDiagnosticoByEmpresa('empresa-b-id', mockGestorEmpresaA)
      ).rejects.toThrow(
        new ForbiddenException('Você não pode acessar dados de outra empresa')
      );

      expect(prisma.pilarEmpresa.findMany).not.toHaveBeenCalled();
    });

    it('deve BLOQUEAR COLABORADOR de acessar diagnóstico de outra empresa (multi-tenant)', async () => {
      await expect(
        service.getDiagnosticoByEmpresa('empresa-b-id', mockColaboradorEmpresaA)
      ).rejects.toThrow(
        new ForbiddenException('Você não pode acessar dados de outra empresa')
      );

      expect(prisma.pilarEmpresa.findMany).not.toHaveBeenCalled();
    });

    it('deve retornar estrutura hierárquica completa (pilares → rotinas → notas)', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      const result = await service.getDiagnosticoByEmpresa('empresa-a-id', mockGestorEmpresaA);

      // Validar estrutura hierárquica
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
      expect(result[0]).toHaveProperty('ordem');
      expect(result[0]).toHaveProperty('responsavel');
      expect(result[0]).toHaveProperty('rotinasEmpresa');
      expect(result[0].rotinasEmpresa[0]).toHaveProperty('notas');

      // Validar ordenação
      expect(result[0].ordem).toBe(1);
      expect(result[1].ordem).toBe(2);
      expect(result[0].rotinasEmpresa[0].ordem).toBe(1);
      expect(result[0].rotinasEmpresa[1].ordem).toBe(2);
    });

    it('deve retornar apenas pilares ativos (filtro ativo: true)', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      await service.getDiagnosticoByEmpresa('empresa-a-id', mockGestorEmpresaA);

      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ativo: true,
          }),
        })
      );
    });

    it('deve retornar apenas nota mais recente de cada rotina (take: 1)', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findMany').mockResolvedValue(mockPilarEmpresaList as any);

      await service.getDiagnosticoByEmpresa('empresa-a-id', mockGestorEmpresaA);

      expect(prisma.pilarEmpresa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            rotinasEmpresa: expect.objectContaining({
              include: expect.objectContaining({
                notas: expect.objectContaining({
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                }),
              }),
            }),
          }),
        })
      );
    });
  });

  // ============================================================
  // R-DIAG-002 e R-DIAG-003: Upsert de Nota com Multi-Tenant
  // ============================================================

  describe('R-DIAG-002: Upsert de nota com auto-save', () => {
    const updateDto = {
      nota: 9,
      criticidade: Criticidade.ALTO,
    };

    it('deve CRIAR nova nota quando não existe nota anterior', async () => {
      const novaNota = {
        id: 'nota-nova-id',
        rotinaEmpresaId: 'rotina-emp-1',
        nota: 9,
        criticidade: Criticidade.ALTO,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'gestor-a-id',
        updatedBy: 'gestor-a-id',
        rotinaEmpresa: {
          nome: 'Reunião Semanal',
          pilarEmpresa: { nome: 'Estratégia' },
        },
      };

      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(null); // Não existe nota
      jest.spyOn(prisma.notaRotina, 'create').mockResolvedValue(novaNota as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      expect(result.message).toBe('Nota criada com sucesso');
      expect(result.nota.id).toBe('nota-nova-id');

      expect(prisma.notaRotina.create).toHaveBeenCalledWith({
        data: {
          rotinaEmpresaId: 'rotina-emp-1',
          nota: 9,
          criticidade: Criticidade.ALTO,
          createdBy: 'gestor-a-id',
          updatedBy: 'gestor-a-id',
        },
        include: expect.any(Object),
      });

      expect(prisma.notaRotina.update).not.toHaveBeenCalled();
    });

    it('deve ATUALIZAR nota existente quando já existe nota', async () => {
      const notaAtualizada = {
        ...mockNotaExistente,
        nota: 9,
        criticidade: Criticidade.ALTO,
        updatedAt: new Date(),
        updatedBy: 'gestor-a-id',
        rotinaEmpresa: {
          nome: 'Reunião Semanal',
          pilarEmpresa: { nome: 'Estratégia' },
        },
      };

      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(mockNotaExistente as any);
      jest.spyOn(prisma.notaRotina, 'update').mockResolvedValue(notaAtualizada as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      expect(result.message).toBe('Nota atualizada com sucesso');
      expect(result.nota.nota).toBe(9);

      expect(prisma.notaRotina.update).toHaveBeenCalledWith({
        where: { id: 'nota-1' },
        data: {
          nota: 9,
          criticidade: Criticidade.ALTO,
          updatedBy: 'gestor-a-id',
        },
        include: expect.any(Object),
      });

      expect(prisma.notaRotina.create).not.toHaveBeenCalled();
    });

    it('deve buscar nota mais recente para upsert (orderBy createdAt desc)', async () => {
      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(mockNotaExistente as any);
      jest.spyOn(prisma.notaRotina, 'update').mockResolvedValue({
        ...mockNotaExistente,
        ...updateDto,
        rotinaEmpresa: { nome: 'Test', pilarEmpresa: { nome: 'Test' } },
      } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      expect(prisma.notaRotina.findFirst).toHaveBeenCalledWith({
        where: { rotinaEmpresaId: 'rotina-emp-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('R-DIAG-003: Validação multi-tenant em upsert de nota', () => {
    const updateDto = {
      nota: 9,
      criticidade: Criticidade.ALTO,
    };

    it('deve permitir ADMINISTRADOR atualizar nota de qualquer empresa', async () => {
      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(mockNotaExistente as any);
      jest.spyOn(prisma.notaRotina, 'update').mockResolvedValue({
        ...mockNotaExistente,
        ...updateDto,
        rotinaEmpresa: { nome: 'Test', pilarEmpresa: { nome: 'Test' } },
      } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.upsertNotaRotina('rotina-emp-1', updateDto, mockAdminUser);

      expect(result.message).toBe('Nota atualizada com sucesso');
      expect(prisma.notaRotina.update).toHaveBeenCalled();
    });

    it('deve permitir GESTOR atualizar nota da própria empresa', async () => {
      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(mockNotaExistente as any);
      jest.spyOn(prisma.notaRotina, 'update').mockResolvedValue({
        ...mockNotaExistente,
        ...updateDto,
        rotinaEmpresa: { nome: 'Test', pilarEmpresa: { nome: 'Test' } },
      } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      expect(result.message).toBe('Nota atualizada com sucesso');
    });

    it('deve BLOQUEAR GESTOR de atualizar nota de outra empresa (multi-tenant)', async () => {
      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaB as any);

      await expect(
        service.upsertNotaRotina('rotina-emp-99', updateDto, mockGestorEmpresaA)
      ).rejects.toThrow(
        new ForbiddenException('Você não pode acessar dados de outra empresa')
      );

      expect(prisma.notaRotina.update).not.toHaveBeenCalled();
      expect(prisma.notaRotina.create).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se rotina não existe', async () => {
      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(null);

      await expect(
        service.upsertNotaRotina('rotina-inexistente', updateDto, mockGestorEmpresaA)
      ).rejects.toThrow(
        new NotFoundException('Rotina não encontrada')
      );

      expect(prisma.notaRotina.update).not.toHaveBeenCalled();
      expect(prisma.notaRotina.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // RA-DIAG-001: Auditoria Completa de Notas
  // CRÍTICO: Garantir rastreabilidade de todas operações CUD
  // ============================================================

  describe('RA-DIAG-001: Auditoria completa de notas (CREATE e UPDATE)', () => {
    const updateDto = {
      nota: 9,
      criticidade: Criticidade.ALTO,
    };

    it('deve registrar auditoria ao CRIAR nota (acao: CREATE)', async () => {
      const novaNota = {
        id: 'nota-nova-id',
        rotinaEmpresaId: 'rotina-emp-1',
        nota: 9,
        criticidade: Criticidade.ALTO,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'gestor-a-id',
        updatedBy: 'gestor-a-id',
        rotinaEmpresa: {
          nome: 'Reunião Semanal',
          pilarEmpresa: { nome: 'Estratégia' },
        },
      };

      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.notaRotina, 'create').mockResolvedValue(novaNota as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      expect(audit.log).toHaveBeenCalledWith({
        usuarioId: 'gestor-a-id',
        usuarioNome: 'Gestor A',
        usuarioEmail: 'gestor-a@test.com',
        entidade: 'NotaRotina',
        entidadeId: 'nota-nova-id',
        acao: 'CREATE',
        dadosDepois: {
          nota: 9,
          criticidade: Criticidade.ALTO,
          rotinaEmpresaId: 'rotina-emp-1',
        },
      });
    });

    it('deve registrar auditoria ao ATUALIZAR nota (acao: UPDATE)', async () => {
      const notaAtualizada = {
        ...mockNotaExistente,
        nota: 9,
        criticidade: Criticidade.ALTO,
        updatedAt: new Date(),
        updatedBy: 'gestor-a-id',
        rotinaEmpresa: {
          nome: 'Reunião Semanal',
          pilarEmpresa: { nome: 'Estratégia' },
        },
      };

      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(mockNotaExistente as any);
      jest.spyOn(prisma.notaRotina, 'update').mockResolvedValue(notaAtualizada as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      expect(audit.log).toHaveBeenCalledWith({
        usuarioId: 'gestor-a-id',
        usuarioNome: 'Gestor A',
        usuarioEmail: 'gestor-a@test.com',
        entidade: 'NotaRotina',
        entidadeId: 'nota-1',
        acao: 'UPDATE',
        dadosAntes: {
          nota: 8,
          criticidade: Criticidade.ALTO,
        },
        dadosDepois: {
          nota: 9,
          criticidade: Criticidade.ALTO,
        },
      });
    });

    it('deve registrar dados completos do usuário na auditoria', async () => {
      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.notaRotina, 'create').mockResolvedValue({
        id: 'nota-id',
        rotinaEmpresaId: 'rotina-emp-1',
        nota: 9,
        criticidade: Criticidade.ALTO,
        rotinaEmpresa: { nome: 'Test', pilarEmpresa: { nome: 'Test' } },
      } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'gestor-a-id',
          usuarioNome: 'Gestor A',
          usuarioEmail: 'gestor-a@test.com',
        })
      );
    });

    it('deve registrar entidade "NotaRotina" e ID correto na auditoria', async () => {
      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.notaRotina, 'create').mockResolvedValue({
        id: 'nota-nova-123',
        rotinaEmpresaId: 'rotina-emp-1',
        nota: 9,
        criticidade: Criticidade.ALTO,
        rotinaEmpresa: { nome: 'Test', pilarEmpresa: { nome: 'Test' } },
      } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'NotaRotina',
          entidadeId: 'nota-nova-123',
        })
      );
    });

    it('deve registrar dadosAntes apenas em UPDATE (não em CREATE)', async () => {
      // CREATE: sem dadosAntes
      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.notaRotina, 'create').mockResolvedValue({
        id: 'nota-id',
        rotinaEmpresaId: 'rotina-emp-1',
        nota: 9,
        criticidade: Criticidade.ALTO,
        rotinaEmpresa: { nome: 'Test', pilarEmpresa: { nome: 'Test' } },
      } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      const createCall = (audit.log as jest.Mock).mock.calls[0][0];
      expect(createCall).not.toHaveProperty('dadosAntes');
      expect(createCall).toHaveProperty('dadosDepois');

      jest.clearAllMocks();

      // UPDATE: com dadosAntes
      jest.spyOn(prisma.rotinaEmpresa, 'findUnique').mockResolvedValue(mockRotinaEmpresaA as any);
      jest.spyOn(prisma.notaRotina, 'findFirst').mockResolvedValue(mockNotaExistente as any);
      jest.spyOn(prisma.notaRotina, 'update').mockResolvedValue({
        ...mockNotaExistente,
        nota: 9,
        rotinaEmpresa: { nome: 'Test', pilarEmpresa: { nome: 'Test' } },
      } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.upsertNotaRotina('rotina-emp-1', updateDto, mockGestorEmpresaA);

      const updateCall = (audit.log as jest.Mock).mock.calls[0][0];
      expect(updateCall).toHaveProperty('dadosAntes');
      expect(updateCall.dadosAntes).toEqual({
        nota: 8,
        criticidade: Criticidade.ALTO,
      });
    });
  });
});


