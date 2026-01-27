import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PeriodosMentoriaController } from './periodos-mentoria.controller';
import { PeriodosMentoriaService } from './periodos-mentoria.service';
import { CreatePeriodoMentoriaDto } from './dto/create-periodo-mentoria.dto';
import { RenovarPeriodoMentoriaDto } from './dto/renovar-periodo-mentoria.dto';

describe('PeriodosMentoriaController - Validação Completa', () => {
  let controller: PeriodosMentoriaController;
  let service: PeriodosMentoriaService;
  let module: TestingModule;

  // Mock users para testes de RBAC
  const mockAdminUser = {
    id: 'admin-uuid',
    email: 'admin@teste.com',
    nome: 'Admin User',
    empresaId: 'empresa-admin',
    perfil: { codigo: 'ADMINISTRADOR' },
  };

  const mockGestorUser = {
    id: 'gestor-uuid',
    email: 'gestor@teste.com',
    nome: 'Gestor User',
    empresaId: 'empresa-a',
    perfil: { codigo: 'GESTOR' },
  };

  const mockColaboradorUser = {
    id: 'colaborador-uuid',
    email: 'colab@teste.com',
    nome: 'Colaborador User',
    empresaId: 'empresa-a',
    perfil: { codigo: 'COLABORADOR' },
  };

  const mockLeituraUser = {
    id: 'leitura-uuid',
    email: 'leitura@teste.com',
    nome: 'Leitura User',
    empresaId: 'empresa-a',
    perfil: { codigo: 'LEITURA' },
  };

  // Mock data
  const mockEmpresa = {
    id: 'empresa-uuid',
    nome: 'Empresa Teste',
    cnpj: '12345678901234',
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPeriodo = {
    id: 'periodo-uuid',
    empresaId: 'empresa-uuid',
    numero: 1,
    dataInicio: new Date('2024-01-01'),
    dataFim: new Date('2024-12-31'),
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findByEmpresa: jest.fn(),
    findAtivo: jest.fn(),
    renovar: jest.fn(),
  };

  const createMockRequest = (user: any): Request => {
    return {
      user,
    } as Request;
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [PeriodosMentoriaController],
      providers: [
        {
          provide: PeriodosMentoriaService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PeriodosMentoriaController>(PeriodosMentoriaController);
    service = module.get<PeriodosMentoriaService>(PeriodosMentoriaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // RBAC - ROLE-BASED ACCESS CONTROL
  // ============================================================

  describe('RBAC: Controle de Acesso por Perfil', () => {
    describe('POST /empresas/:id/periodos-mentoria', () => {
      it('ADMINISTRADOR pode criar períodos', async () => {
        const createDto: CreatePeriodoMentoriaDto = { dataInicio: '2024-01-01' };
        const req = createMockRequest(mockAdminUser);
        
        jest.spyOn(service, 'create').mockResolvedValue(mockPeriodo as any);

        const result = await controller.create('empresa-uuid', createDto, req);

        expect(result).toEqual(mockPeriodo);
        expect(service.create).toHaveBeenCalledWith('empresa-uuid', createDto, 'admin-uuid');
      });

      // NOTA: Em controllers, os guards são testados em nível de integração
      // os testes unitários focam na lógica do controller
    });

    describe('POST /empresas/:id/periodos-mentoria/:periodoId/renovar', () => {
      it('ADMINISTRADOR pode renovar períodos', async () => {
        const renovarDto: RenovarPeriodoMentoriaDto = { dataInicio: '2025-01-01' };
        const req = createMockRequest(mockAdminUser);
        
        jest.spyOn(service, 'renovar').mockResolvedValue(mockPeriodo as any);

        const result = await controller.renovar('empresa-uuid', 'periodo-uuid', renovarDto, req);

        expect(result).toEqual(mockPeriodo);
        expect(service.renovar).toHaveBeenCalledWith('empresa-uuid', 'periodo-uuid', renovarDto, 'admin-uuid');
      });
    });

    describe('GET /empresas/:id/periodos-mentoria', () => {
      it('qualquer perfil autenticado pode listar períodos', async () => {
        jest.spyOn(service, 'findByEmpresa').mockResolvedValue([mockPeriodo] as any);

        const result = await controller.findAll('empresa-uuid');

        expect(result).toEqual([mockPeriodo]);
        expect(service.findByEmpresa).toHaveBeenCalledWith('empresa-uuid');
      });
    });

    describe('GET /empresas/:id/periodos-mentoria/ativo', () => {
      it('qualquer perfil autenticado pode buscar período ativo', async () => {
        jest.spyOn(service, 'findAtivo').mockResolvedValue(mockPeriodo as any);

        const result = await controller.findAtivo('empresa-uuid');

        expect(result).toEqual(mockPeriodo);
        expect(service.findAtivo).toHaveBeenCalledWith('empresa-uuid');
      });
    });
  });

  // ============================================================
  // MULTI-TENANCY - ISOLAMENTO POR EMPRESA
  // ============================================================

  describe('Multi-Tenancy: Isolamento por Empresa', () => {
    it('deve passar empresaId corretamente para o service', async () => {
      jest.spyOn(service, 'findByEmpresa').mockResolvedValue([] as any);

      await controller.findAll('empresa-especifica-123');

      expect(service.findByEmpresa).toHaveBeenCalledWith('empresa-especifica-123');
    });

    it('deve passar empresaId e periodoId corretamente na renovação', async () => {
      const renovarDto: RenovarPeriodoMentoriaDto = { dataInicio: '2025-01-01' };
      const req = createMockRequest(mockAdminUser);
      jest.spyOn(service, 'renovar').mockResolvedValue(mockPeriodo as any);

      await controller.renovar('empresa-456', 'periodo-789', renovarDto, req);

      expect(service.renovar).toHaveBeenCalledWith('empresa-456', 'periodo-789', renovarDto, 'admin-uuid');
    });

    it('deve tratar empresaId como parâmetro de rota obrigatório', async () => {
      jest.spyOn(service, 'findAtivo').mockResolvedValue(mockPeriodo as any);

      const result = await controller.findAtivo('empresa-rota-123');

      expect(result).toEqual(mockPeriodo);
      expect(service.findAtivo).toHaveBeenCalledWith('empresa-rota-123');
    });
  });

  // ============================================================
  // VALIDAÇÕES DE REQUEST E RESPONSE
  // ============================================================

  describe('Validações de Request e Response', () => {
    describe('create()', () => {
      it('deve extrair user.id do request e passar para service', async () => {
        const createDto: CreatePeriodoMentoriaDto = { dataInicio: '2024-01-01' };
        const req = createMockRequest({ id: 'user-extrated-123' } as any);
        
        jest.spyOn(service, 'create').mockResolvedValue(mockPeriodo as any);

        await controller.create('empresa-uuid', createDto, req);

        expect(service.create).toHaveBeenCalledWith('empresa-uuid', createDto, 'user-extrated-123');
      });

      it('deve passar undefined se user não tem id', async () => {
        const createDto: CreatePeriodoMentoriaDto = { dataInicio: '2024-01-01' };
        const req = createMockRequest({} as any);
        
        jest.spyOn(service, 'create').mockResolvedValue(mockPeriodo as any);

        await controller.create('empresa-uuid', createDto, req);

        expect(service.create).toHaveBeenCalledWith('empresa-uuid', createDto, undefined);
      });

      it('deve repassar exceções do service sem modificação', async () => {
        const createDto: CreatePeriodoMentoriaDto = { dataInicio: '2024-01-01' };
        const req = createMockRequest(mockAdminUser);
        
        jest.spyOn(service, 'create').mockRejectedValue(
          new ConflictException('Empresa já possui período ativo'),
        );

        await expect(controller.create('empresa-uuid', createDto, req)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('renovar()', () => {
      it('deve extrair user.id e passar para service na renovação', async () => {
        const renovarDto: RenovarPeriodoMentoriaDto = { dataInicio: '2025-01-01' };
        const req = createMockRequest({ id: 'user-renovacao-456' } as any);
        
        jest.spyOn(service, 'renovar').mockResolvedValue(mockPeriodo as any);

        await controller.renovar('empresa-uuid', 'periodo-uuid', renovarDto, req);

        expect(service.renovar).toHaveBeenCalledWith('empresa-uuid', 'periodo-uuid', renovarDto, 'user-renovacao-456');
      });

      it('deve repassar NotFoundException na renovação', async () => {
        const renovarDto: RenovarPeriodoMentoriaDto = { dataInicio: '2025-01-01' };
        const req = createMockRequest(mockAdminUser);
        
        jest.spyOn(service, 'renovar').mockRejectedValue(
          new NotFoundException('Período de mentoria não encontrado'),
        );

        await expect(
          controller.renovar('empresa-uuid', 'periodo-inexistente', renovarDto, req),
        ).rejects.toThrow(NotFoundException);
      });

      it('deve repassar BadRequestException na renovação', async () => {
        const renovarDto: RenovarPeriodoMentoriaDto = { dataInicio: '2024-06-01' };
        const req = createMockRequest(mockAdminUser);
        
        jest.spyOn(service, 'renovar').mockRejectedValue(
          new BadRequestException('Data de início da renovação deve ser posterior'),
        );

        await expect(
          controller.renovar('empresa-uuid', 'periodo-uuid', renovarDto, req),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  // ============================================================
  // INTEGRAÇÃO COM OUTROS MÓDULOS (INFLUÊNCIA)
  // ============================================================

  describe('Integração com Outros Módulos', () => {
    it('findAtivo deve fornecer dados para Cockpit validar períodos', async () => {
      const periodoAtivo = {
        ...mockPeriodo,
        id: 'periodo-para-cockpit-uuid',
        dataInicio: new Date('2024-01-01'),
        dataFim: new Date('2024-12-31'),
      };

      jest.spyOn(service, 'findAtivo').mockResolvedValue(periodoAtivo as any);

      const result = await controller.findAtivo('empresa-para-cockpit');

      // Cockpit usaria estes dados para:
      expect(result!.id).toBeDefined(); // periodoMentoriaId em IndicadorMensal
      expect(result!.dataInicio).toBeInstanceOf(Date); // Validação de valores mensais
      expect(result!.dataFim).toBeInstanceOf(Date); // Janela temporal
      expect(result!.ativo).toBe(true); // Verificar se está ativo
    });

    it('findAll deve fornecer contexto para Evolution de Diagnosticos', async () => {
      const periodosHistoricos = [
        { ...mockPeriodo, numero: 2, id: 'periodo-evolution-2' },
        { ...mockPeriodo, numero: 1, id: 'periodo-evolution-1', ativo: false },
      ];

      jest.spyOn(service, 'findByEmpresa').mockResolvedValue(periodosHistoricos as any);

      const result = await controller.findAll('empresa-evolution');

      // Evolution organizaria dados históricos por período:
      expect(result).toHaveLength(2);
      expect(result[0].numero).toBe(2); // Mais recente (ordem decrescente)
      expect(result[1].numero).toBe(1); // Mais antigo
    });

    it('deve suportar criação de período que será usado por Indicadores Mensais', async () => {
      const createDto: CreatePeriodoMentoriaDto = { dataInicio: '2024-01-01' };
      const req = createMockRequest(mockAdminUser);
      
      const novoPeriodo = {
        ...mockPeriodo,
        id: 'periodo-para-indicadores',
        numero: 3,
        dataInicio: new Date('2024-01-01'),
        dataFim: new Date('2024-12-31'),
      };

      jest.spyOn(service, 'create').mockResolvedValue(novoPeriodo as any);

      const result = await controller.create('empresa-indicadores', createDto, req);

      // Indicadores Mensais usariam:
      expect(result.id).toBe('periodo-para-indicadores'); // FK em IndicadorMensal
      expect(result.dataInicio).toBeDefined(); // Cálculo dos 13 meses
      expect(result.dataFim).toBeDefined(); // Validação de datas mensais
      expect(result.numero).toBe(3); // Organização histórica
    });
  });

  // ============================================================
  // VALIDAÇÕES DE PARÂMETROS E TIPOS
  // ============================================================

  describe('Validações de Parâmetros e Tipos', () => {
    it('create deve aceitar empresaId como string UUID', async () => {
      const createDto: CreatePeriodoMentoriaDto = { dataInicio: '2024-01-01' };
      const req = createMockRequest(mockAdminUser);
      jest.spyOn(service, 'create').mockResolvedValue(mockPeriodo as any);

      const uuidEmpresaId = '550e8400-e29b-41d4-a716-446655440000';
      await controller.create(uuidEmpresaId, createDto, req);

      expect(service.create).toHaveBeenCalledWith(uuidEmpresaId, createDto, 'admin-uuid');
    });

    it('renovar deve aceitar periodoId como string UUID', async () => {
      const renovarDto: RenovarPeriodoMentoriaDto = { dataInicio: '2025-01-01' };
      const req = createMockRequest(mockAdminUser);
      jest.spyOn(service, 'renovar').mockResolvedValue(mockPeriodo as any);

      const uuidPeriodoId = '550e8400-e29b-41d4-a716-446655440001';
      await controller.renovar('empresa-uuid', uuidPeriodoId, renovarDto, req);

      expect(service.renovar).toHaveBeenCalledWith('empresa-uuid', uuidPeriodoId, renovarDto, 'admin-uuid');
    });

    it('deve processar DTOs com estrutura correta', async () => {
      const createDto: CreatePeriodoMentoriaDto = { dataInicio: '2024-03-15' };
      const renovarDto: RenovarPeriodoMentoriaDto = { dataInicio: '2025-03-15' };
      const req = createMockRequest(mockAdminUser);
      
      jest.spyOn(service, 'create').mockResolvedValue(mockPeriodo as any);
      jest.spyOn(service, 'renovar').mockResolvedValue(mockPeriodo as any);

      await controller.create('empresa-uuid', createDto, req);
      await controller.renovar('empresa-uuid', 'periodo-uuid', renovarDto, req);

      expect(service.create).toHaveBeenCalledWith('empresa-uuid', { dataInicio: '2024-03-15' }, 'admin-uuid');
      expect(service.renovar).toHaveBeenCalledWith('empresa-uuid', 'periodo-uuid', { dataInicio: '2025-03-15' }, 'admin-uuid');
    });
  });

  // ============================================================
  // EDGE CASES E SCENÁRIOS EXCEPCIONAIS
  // ============================================================

  describe('Edge Cases e Scenários Excepcionais', () => {
    it('findAll deve retornar array vazio se empresa não tem períodos', async () => {
      jest.spyOn(service, 'findByEmpresa').mockResolvedValue([] as any);

      const result = await controller.findAll('empresa-sem-periodos');

      expect(result).toEqual([]);
      expect(service.findByEmpresa).toHaveBeenCalledWith('empresa-sem-periodos');
    });

    it('findAtivo deve retornar null se empresa não tem período ativo', async () => {
      jest.spyOn(service, 'findAtivo').mockResolvedValue(null);

      const result = await controller.findAtivo('empresa-sem-ativo');

      expect(result).toBeNull();
      expect(service.findAtivo).toHaveBeenCalledWith('empresa-sem-ativo');
    });

    it('deve lidar com request sem user gracefully', async () => {
      const createDto: CreatePeriodoMentoriaDto = { dataInicio: '2024-01-01' };
      const req = {} as Request; // Request sem user
      
      jest.spyOn(service, 'create').mockResolvedValue(mockPeriodo as any);

      const result = await controller.create('empresa-uuid', createDto, req);

      expect(result).toEqual(mockPeriodo);
      expect(service.create).toHaveBeenCalledWith('empresa-uuid', createDto, undefined);
    });

    it('deve repassar exceções inesperadas do service', async () => {
      jest.spyOn(service, 'findByEmpresa').mockRejectedValue(
        new Error('Erro inesperado de banco de dados'),
      );

      await expect(controller.findAll('empresa-uuid')).rejects.toThrow(
        'Erro inesperado de banco de dados',
      );
    });
  });
});