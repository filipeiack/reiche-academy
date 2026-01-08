import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';

/**
 * QA UNITÁRIO ESTRITO - Suite Completa
 * Valida TODAS as regras de /docs/business-rules/empresas.md
 * Valida correções de segurança (RA-EMP-001, RA-EMP-002, RA-EMP-003)
 * Valida correções de padrão (V-001, V-002, V-003, V-004)
 * Criado de forma independente da implementação
 */
describe('EmpresasService - Validação Completa de Regras de Negócio', () => {
  let service: EmpresasService;
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

  const mockEmpresaA = {
    id: 'empresa-a-id',
    nome: 'Empresa A Ltda',
    cnpj: '12.345.678/0001-90',
    tipoNegocio: 'Consultoria',
    cidade: 'São Paulo',
    estado: 'SP',
    ativo: true,
    logoUrl: '/images/logos/empresa-a.png',
    loginUrl: 'empresa-a',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    updatedBy: null,
    usuarios: [],
    pilares: [],
    _count: { usuarios: 5, pilares: 3 },
  };

  const mockEmpresaB = {
    id: 'empresa-b-id',
    nome: 'Empresa B S.A.',
    cnpj: '98.765.432/0001-10',
    tipoNegocio: 'Tecnologia',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    ativo: true,
    logoUrl: null,
    loginUrl: 'empresa-b',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    updatedBy: null,
    usuarios: [],
    pilares: [],
    _count: { usuarios: 2, pilares: 1 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresasService,
        {
          provide: PrismaService,
          useValue: {
            empresa: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            pilarEmpresa: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
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

    service = module.get<EmpresasService>(EmpresasService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // REGRAS DE NEGÓCIO ORIGINAIS (empresas.md)
  // ============================================================

  describe('R-EMP-001: Validação de CNPJ', () => {
    it('deve bloquear criação de empresa com CNPJ duplicado', async () => {
      const createDto = {
        nome: 'Nova Empresa',
        cnpj: '12.345.678/0001-90',
        cidade: 'São Paulo',
        estado: 'SP' as any,
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);

      await expect(service.create(createDto, 'admin-id')).rejects.toThrow(
        new ConflictException('CNPJ já cadastrado')
      );

      expect(prisma.empresa.findUnique).toHaveBeenCalledWith({
        where: { cnpj: createDto.cnpj },
      });
    });

    it('deve permitir criação de empresa com CNPJ único', async () => {
      const createDto = {
        nome: 'Nova Empresa',
        cnpj: '11.111.111/0001-11',
        cidade: 'São Paulo',
        estado: 'SP' as any,
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.empresa, 'create').mockResolvedValue(mockEmpresaA as any);

      const result = await service.create(createDto, 'admin-id');

      expect(result).toEqual(mockEmpresaA);
      expect(prisma.empresa.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          createdBy: 'admin-id',
        },
      });
    });
  });

  describe('R-EMP-013: Validação de CNPJ em atualização', () => {
    it('deve bloquear atualização com CNPJ de outra empresa', async () => {
      const updateDto = {
        cnpj: '98.765.432/0001-10', // CNPJ da empresa B
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'findFirst').mockResolvedValue(mockEmpresaB as any);

      await expect(
        service.update('empresa-a-id', updateDto, 'admin-id', mockAdminUser)
      ).rejects.toThrow(new ConflictException('CNPJ já cadastrado em outra empresa'));

      expect(prisma.empresa.findFirst).toHaveBeenCalledWith({
        where: {
          cnpj: updateDto.cnpj,
          id: { not: 'empresa-a-id' },
        },
      });
    });

    it('deve permitir atualização mantendo próprio CNPJ', async () => {
      const updateDto = {
        nome: 'Empresa A Updated',
        cnpj: '12.345.678/0001-90', // Mesmo CNPJ
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, ...updateDto } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.update('empresa-a-id', updateDto, 'admin-id', mockAdminUser);

      expect(result.nome).toBe('Empresa A Updated');
      expect(prisma.empresa.update).toHaveBeenCalled();
    });
  });

  describe('R-EMP-017: Soft Delete de Empresa', () => {
    it('deve desativar empresa ao invés de deletar fisicamente', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, ativo: false } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.remove('empresa-a-id', 'admin-id', mockAdminUser);

      expect(result.ativo).toBe(false);
      expect(prisma.empresa.update).toHaveBeenCalledWith({
        where: { id: 'empresa-a-id' },
        data: {
          ativo: false,
          updatedBy: 'admin-id',
        },
      });
    });

    it('deve registrar auditoria de soft delete', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, ativo: false } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.remove('empresa-a-id', 'admin-id', mockAdminUser);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-id',
          entidade: 'empresas',
          entidadeId: 'empresa-a-id',
          acao: 'DELETE',
        })
      );
    });
  });

  // ============================================================
  // RA-EMP-001: Implementar Isolamento Multi-Tenant (BLOQUEANTE)
  // ============================================================

  describe('RA-EMP-001: Isolamento Multi-Tenant em update()', () => {
    it('deve permitir ADMINISTRADOR atualizar qualquer empresa', async () => {
      const updateDto = { nome: 'Empresa Updated' };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, ...updateDto } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.update('empresa-a-id', updateDto, 'admin-id', mockAdminUser);

      expect(result.nome).toBe('Empresa Updated');
    });

    it('deve permitir GESTOR atualizar própria empresa', async () => {
      const updateDto = { nome: 'Empresa A Updated' };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, ...updateDto } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.update('empresa-a-id', updateDto, 'gestor-a-id', mockGestorEmpresaA);

      expect(result.nome).toBe('Empresa A Updated');
    });

    it('deve bloquear GESTOR de atualizar empresa de outro tenant', async () => {
      const updateDto = { nome: 'Tentativa Update' };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaB as any);

      await expect(
        service.update('empresa-b-id', updateDto, 'gestor-a-id', mockGestorEmpresaA)
      ).rejects.toThrow(
        new ForbiddenException('Você não pode atualizar dados de outra empresa')
      );

      expect(prisma.empresa.update).not.toHaveBeenCalled();
    });
  });

  describe('RA-EMP-001: Isolamento Multi-Tenant em remove()', () => {
    it('deve permitir ADMINISTRADOR desativar qualquer empresa', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, ativo: false } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.remove('empresa-a-id', 'admin-id', mockAdminUser);

      expect(result.ativo).toBe(false);
    });

    it('deve bloquear GESTOR de desativar empresa de outro tenant', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaB as any);

      await expect(
        service.remove('empresa-b-id', 'gestor-a-id', mockGestorEmpresaA)
      ).rejects.toThrow(
        new ForbiddenException('Você não pode desativar dados de outra empresa')
      );

      expect(prisma.empresa.update).not.toHaveBeenCalled();
    });
  });

  describe('RA-EMP-001: Isolamento Multi-Tenant em updateLogo()', () => {
    it('deve permitir ADMINISTRADOR atualizar logo de qualquer empresa', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, logoUrl: '/new-logo.png' } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.updateLogo('empresa-a-id', '/new-logo.png', 'admin-id', mockAdminUser);

      expect(result.logoUrl).toBe('/new-logo.png');
    });

    it('deve bloquear GESTOR de atualizar logo de empresa de outro tenant', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaB as any);

      await expect(
        service.updateLogo('empresa-b-id', '/new-logo.png', 'gestor-a-id', mockGestorEmpresaA)
      ).rejects.toThrow(
        new ForbiddenException('Você não pode alterar logo de dados de outra empresa')
      );

      expect(prisma.empresa.update).not.toHaveBeenCalled();
    });
  });

  describe('RA-EMP-001: Isolamento Multi-Tenant em deleteLogo()', () => {
    it('deve permitir ADMINISTRADOR deletar logo de qualquer empresa', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, logoUrl: null } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.deleteLogo('empresa-a-id', 'admin-id', mockAdminUser);

      expect(result.logoUrl).toBeNull();
    });

    it('deve bloquear GESTOR de deletar logo de empresa de outro tenant', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaB as any);

      await expect(
        service.deleteLogo('empresa-b-id', 'gestor-a-id', mockGestorEmpresaA)
      ).rejects.toThrow(
        new ForbiddenException('Você não pode deletar logo de dados de outra empresa')
      );

      expect(prisma.empresa.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // RA-EMP-003: Validar Unicidade de loginUrl (ALTA)
  // ============================================================

  describe('RA-EMP-003: Validar Unicidade de loginUrl em create()', () => {
    it('deve bloquear criação com loginUrl duplicado', async () => {
      const createDto = {
        nome: 'Nova Empresa',
        cnpj: '11.111.111/0001-11',
        cidade: 'São Paulo',
        estado: 'SP' as any,
        loginUrl: 'empresa-a', // Já existe na empresa A
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null); // CNPJ ok
      jest.spyOn(prisma.empresa, 'findFirst').mockResolvedValue(mockEmpresaA as any); // loginUrl existe

      await expect(service.create(createDto, 'admin-id')).rejects.toThrow(
        new ConflictException('loginUrl já está em uso por outra empresa')
      );

      expect(prisma.empresa.findFirst).toHaveBeenCalledWith({
        where: { loginUrl: 'empresa-a' },
      });
    });

    it('deve permitir criação com loginUrl único', async () => {
      const createDto = {
        nome: 'Nova Empresa',
        cnpj: '11.111.111/0001-11',
        cidade: 'São Paulo',
        estado: 'SP' as any,
        loginUrl: 'empresa-nova',
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null); // CNPJ ok
      jest.spyOn(prisma.empresa, 'findFirst').mockResolvedValue(null); // loginUrl único
      jest.spyOn(prisma.empresa, 'create').mockResolvedValue(mockEmpresaA as any);

      const result = await service.create(createDto, 'admin-id');

      expect(result).toEqual(mockEmpresaA);
    });

    it('deve permitir criação sem loginUrl', async () => {
      const createDto = {
        nome: 'Nova Empresa',
        cnpj: '11.111.111/0001-11',
        cidade: 'São Paulo',
        estado: 'SP' as any,
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.empresa, 'create').mockResolvedValue(mockEmpresaA as any);

      const result = await service.create(createDto, 'admin-id');

      expect(result).toEqual(mockEmpresaA);
      expect(prisma.empresa.findFirst).not.toHaveBeenCalled(); // Não valida loginUrl se ausente
    });
  });

  describe('RA-EMP-003: Validar Unicidade de loginUrl em update()', () => {
    it('deve bloquear atualização com loginUrl de outra empresa', async () => {
      const updateDto = {
        loginUrl: 'empresa-b', // loginUrl da empresa B
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'findFirst').mockResolvedValue(mockEmpresaB as any); // loginUrl existe em outra

      await expect(
        service.update('empresa-a-id', updateDto, 'admin-id', mockAdminUser)
      ).rejects.toThrow(new ConflictException('loginUrl já está em uso por outra empresa'));

      expect(prisma.empresa.findFirst).toHaveBeenCalledWith({
        where: {
          loginUrl: 'empresa-b',
          id: { not: 'empresa-a-id' },
        },
      });
    });

    it('deve permitir atualização mantendo próprio loginUrl', async () => {
      const updateDto = {
        loginUrl: 'empresa-a', // Mesmo loginUrl
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'findFirst').mockResolvedValue(null); // Não encontra outro com mesmo loginUrl
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.update('empresa-a-id', updateDto, 'admin-id', mockAdminUser);

      expect(result).toEqual(mockEmpresaA);
    });
  });

  // ============================================================
  // V-003: Validar String Vazia em loginUrl (ALTA)
  // ============================================================

  describe('V-003: Validar String Vazia em loginUrl', () => {
    it('deve ignorar validação se loginUrl for string vazia em create()', async () => {
      const createDto = {
        nome: 'Nova Empresa',
        cnpj: '11.111.111/0001-11',
        cidade: 'São Paulo',
        estado: 'SP' as any,
        loginUrl: '', // String vazia
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.empresa, 'create').mockResolvedValue(mockEmpresaA as any);

      const result = await service.create(createDto, 'admin-id');

      expect(result).toEqual(mockEmpresaA);
      expect(prisma.empresa.findFirst).not.toHaveBeenCalled(); // Não valida string vazia
    });

    it('deve ignorar validação se loginUrl for apenas espaços em create()', async () => {
      const createDto = {
        nome: 'Nova Empresa',
        cnpj: '11.111.111/0001-11',
        cidade: 'São Paulo',
        estado: 'SP' as any,
        loginUrl: '   ', // Apenas espaços
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.empresa, 'create').mockResolvedValue(mockEmpresaA as any);

      const result = await service.create(createDto, 'admin-id');

      expect(result).toEqual(mockEmpresaA);
      expect(prisma.empresa.findFirst).not.toHaveBeenCalled(); // trim() === ''
    });

    it('deve ignorar validação se loginUrl for string vazia em update()', async () => {
      const updateDto = {
        loginUrl: '', // String vazia
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.update('empresa-a-id', updateDto, 'admin-id', mockAdminUser);

      expect(result).toEqual(mockEmpresaA);
      expect(prisma.empresa.findFirst).not.toHaveBeenCalled(); // Não valida string vazia
    });
  });

  // ============================================================
  // V-002: Adicionar Auditoria em updateLogo/deleteLogo (CRÍTICA)
  // ============================================================

  describe('V-002: Auditoria em updateLogo()', () => {
    it('deve registrar auditoria ao atualizar logo', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, logoUrl: '/new-logo.png' } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.updateLogo('empresa-a-id', '/new-logo.png', 'admin-id', mockAdminUser);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-id',
          usuarioNome: 'Admin User',
          usuarioEmail: 'admin@test.com',
          entidade: 'empresas',
          entidadeId: 'empresa-a-id',
          acao: 'UPDATE',
        })
      );
    });

    it('deve atualizar updatedBy ao atualizar logo', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.updateLogo('empresa-a-id', '/new-logo.png', 'admin-id', mockAdminUser);

      expect(prisma.empresa.update).toHaveBeenCalledWith({
        where: { id: 'empresa-a-id' },
        data: { logoUrl: '/new-logo.png', updatedBy: 'admin-id' },
      });
    });
  });

  describe('V-002: Auditoria em deleteLogo()', () => {
    it('deve registrar auditoria ao deletar logo', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue({ ...mockEmpresaA, logoUrl: null } as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.deleteLogo('empresa-a-id', 'admin-id', mockAdminUser);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-id',
          usuarioNome: 'Admin User',
          usuarioEmail: 'admin@test.com',
          entidade: 'empresas',
          entidadeId: 'empresa-a-id',
          acao: 'UPDATE',
        })
      );
    });

    it('deve atualizar updatedBy ao deletar logo', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.deleteLogo('empresa-a-id', 'admin-id', mockAdminUser);

      expect(prisma.empresa.update).toHaveBeenCalledWith({
        where: { id: 'empresa-a-id' },
        data: { logoUrl: null, updatedBy: 'admin-id' },
      });
    });
  });

  // ============================================================
  // V-004: Usar requestUser na Auditoria (MÉDIA)
  // ============================================================

  describe('V-004: Usar requestUser.nome e requestUser.email na auditoria', () => {
    it('deve usar requestUser.nome em update()', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.update('empresa-a-id', { nome: 'Updated' }, 'gestor-a-id', mockGestorEmpresaA);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioNome: 'Gestor A',
          usuarioEmail: 'gestor-a@test.com',
        })
      );
    });

    it('deve usar requestUser.nome em remove()', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.remove('empresa-a-id', 'gestor-a-id', mockGestorEmpresaA);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioNome: 'Gestor A',
          usuarioEmail: 'gestor-a@test.com',
        })
      );
    });

    it('deve usar requestUser.nome em updateLogo()', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.updateLogo('empresa-a-id', '/logo.png', 'gestor-a-id', mockGestorEmpresaA);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioNome: 'Gestor A',
          usuarioEmail: 'gestor-a@test.com',
        })
      );
    });

    it('deve usar requestUser.nome em deleteLogo()', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.deleteLogo('empresa-a-id', 'gestor-a-id', mockGestorEmpresaA);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioNome: 'Gestor A',
          usuarioEmail: 'gestor-a@test.com',
        })
      );
    });
  });

  // ============================================================
  // V-001: Interface RequestUser Compartilhada (CRÍTICA)
  // ============================================================

  describe('V-001: Interface RequestUser importada de common/interfaces', () => {
    it('deve aceitar RequestUser com estrutura correta', async () => {
      const validRequestUser: RequestUser = {
        id: 'test-id',
        email: 'test@test.com',
        nome: 'Test User',
        empresaId: 'empresa-a-id', // Mesma empresa para passar validação multi-tenant
        perfil: { codigo: 'GESTOR', nivel: 2 },
      };

      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(prisma.empresa, 'update').mockResolvedValue(mockEmpresaA as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      // Se interface não fosse compartilhada, erro de tipo ocorreria aqui
      await expect(
        service.update('empresa-a-id', { nome: 'Test' }, 'test-id', validRequestUser)
      ).resolves.toBeDefined();
    });
  });

  // ============================================================
  // Testes de Casos de Erro
  // ============================================================

  describe('Casos de Erro', () => {
    it('deve lançar NotFoundException se empresa não existir em findOne()', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('empresa-inexistente')).rejects.toThrow(
        new NotFoundException('Empresa não encontrada')
      );
    });

    it('deve lançar NotFoundException se empresa não existir em update()', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update('empresa-inexistente', { nome: 'Test' }, 'admin-id', mockAdminUser)
      ).rejects.toThrow(new NotFoundException('Empresa não encontrada'));
    });

    it('deve lançar NotFoundException se empresa não existir em remove()', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);

      await expect(
        service.remove('empresa-inexistente', 'admin-id', mockAdminUser)
      ).rejects.toThrow(new NotFoundException('Empresa não encontrada'));
    });

    it('deve lançar NotFoundException se empresa não existir em updateLogo()', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateLogo('empresa-inexistente', '/logo.png', 'admin-id', mockAdminUser)
      ).rejects.toThrow(new NotFoundException('Empresa não encontrada'));
    });

    it('deve lançar NotFoundException se empresa não existir em deleteLogo()', async () => {
      jest.spyOn(prisma.empresa, 'findUnique').mockResolvedValue(null);

      await expect(
        service.deleteLogo('empresa-inexistente', 'admin-id', mockAdminUser)
      ).rejects.toThrow(new NotFoundException('Empresa não encontrada'));
    });
  });
});
