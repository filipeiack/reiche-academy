import { Test, TestingModule } from '@nestjs/testing';
import { CockpitPilaresController } from './cockpit-pilares.controller';
import { CockpitPilaresService } from './cockpit-pilares.service';
import { CreateCockpitPilarDto } from './dto/create-cockpit-pilar.dto';
import { UpdateCockpitPilarDto } from './dto/update-cockpit-pilar.dto';
import { CreateIndicadorCockpitDto } from './dto/create-indicador-cockpit.dto';
import { UpdateIndicadorCockpitDto } from './dto/update-indicador-cockpit.dto';
import { UpdateValoresMensaisDto } from './dto/update-valores-mensais.dto';
import { UpdateProcessoPrioritarioDto } from './dto/update-processo-prioritario.dto';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Request } from 'express';

describe('CockpitPilaresController', () => {
  let controller: CockpitPilaresController;
  let service: CockpitPilaresService;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    perfil: { codigo: 'ADMINISTRADOR' },
    empresaId: 'empresa-1',
  };

  const mockRequest = { user: mockUser } as Request & { user: any };

  const mockCockpit = {
    id: 'cockpit-1',
    nome: 'Cockpit Test',
    pilarEmpresaId: 'pilar-1',
    ativo: true,
  };

  const mockService = {
    createCockpit: jest.fn(),
    getCockpitsByEmpresa: jest.fn(),
    getCockpitById: jest.fn(),
    updateCockpit: jest.fn(),
    deleteCockpit: jest.fn(),
    createIndicador: jest.fn(),
    updateIndicador: jest.fn(),
    deleteIndicador: jest.fn(),
    updateValoresMensais: jest.fn(),
    getMesesIndicador: jest.fn(),
    getProcessosPrioritarios: jest.fn(),
    updateProcessoPrioritario: jest.fn(),
    getDadosGraficos: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CockpitPilaresController],
      providers: [
        {
          provide: CockpitPilaresService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CockpitPilaresController>(CockpitPilaresController);
    service = module.get<CockpitPilaresService>(CockpitPilaresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ==================== COCKPITS ====================

  describe('createCockpit', () => {
    it('should create cockpit successfully', async () => {
      const dto: CreateCockpitPilarDto = {
        pilarEmpresaId: 'pilar-1',
        missao: 'Test Mission',
        entradas: 'Test Inputs',
        saidas: 'Test Outputs',
      };

      mockService.createCockpit.mockResolvedValue(mockCockpit);

      const result = await controller.createCockpit('pilar-1', dto, mockRequest);

      expect(service.createCockpit).toHaveBeenCalledWith(
        { ...dto, pilarEmpresaId: 'pilar-1' },
        mockUser
      );
      expect(result).toBe(mockCockpit);
    });

    it('should throw ConflictException when cockpit already exists', async () => {
      const dto: CreateCockpitPilarDto = { 
        pilarEmpresaId: 'pilar-1',
        missao: 'Existing Mission' 
      };

      mockService.createCockpit.mockRejectedValue(
        new ConflictException('Este pilar já possui um cockpit')
      );

      await expect(
        controller.createCockpit('pilar-1', dto, mockRequest)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException for cross-tenant access', async () => {
      const dto: CreateCockpitPilarDto = { 
        pilarEmpresaId: 'pilar-1',
        missao: 'Cross Tenant Mission' 
      };

      mockService.createCockpit.mockRejectedValue(
        new ForbiddenException('Acesso negado (multi-tenant)')
      );

      await expect(
        controller.createCockpit('pilar-1', dto, mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when pilar not found', async () => {
      const dto: CreateCockpitPilarDto = { 
        pilarEmpresaId: 'invalid-pilar',
        missao: 'Orphan Mission' 
      };

      mockService.createCockpit.mockRejectedValue(
        new NotFoundException('Pilar não encontrado')
      );

      await expect(
        controller.createCockpit('invalid-pilar', dto, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCockpitsByEmpresa', () => {
    it('should return cockpits list', async () => {
      const cockpits = [mockCockpit];
      mockService.getCockpitsByEmpresa.mockResolvedValue(cockpits);

      const result = await controller.getCockpitsByEmpresa('empresa-1', mockRequest);

      expect(service.getCockpitsByEmpresa).toHaveBeenCalledWith('empresa-1', mockUser);
      expect(result).toBe(cockpits);
    });

    it('should throw ForbiddenException for cross-tenant access', async () => {
      mockService.getCockpitsByEmpresa.mockRejectedValue(
        new ForbiddenException('Acesso negado (multi-tenant)')
      );

      await expect(
        controller.getCockpitsByEmpresa('other-empresa', mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getCockpitById', () => {
    it('should return cockpit by ID', async () => {
      mockService.getCockpitById.mockResolvedValue(mockCockpit);

      const result = await controller.getCockpitById('cockpit-1', mockRequest);

      expect(service.getCockpitById).toHaveBeenCalledWith('cockpit-1', mockUser);
      expect(result).toBe(mockCockpit);
    });

    it('should throw NotFoundException when cockpit not found', async () => {
      mockService.getCockpitById.mockRejectedValue(
        new NotFoundException('Cockpit não encontrado')
      );

      await expect(
        controller.getCockpitById('invalid-cockpit', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for cross-tenant access', async () => {
      mockService.getCockpitById.mockRejectedValue(
        new ForbiddenException('Acesso negado (multi-tenant)')
      );

      await expect(
        controller.getCockpitById('cross-tenant-cockpit', mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateCockpit', () => {
    it('should update cockpit successfully', async () => {
      const dto: UpdateCockpitPilarDto = {
        missao: 'Updated Mission',
      };

      const updatedCockpit = { ...mockCockpit, ...dto };
      mockService.updateCockpit.mockResolvedValue(updatedCockpit);

      const result = await controller.updateCockpit('cockpit-1', dto, mockRequest);

      expect(service.updateCockpit).toHaveBeenCalledWith('cockpit-1', dto, mockUser);
      expect(result).toBe(updatedCockpit);
    });

    it('should throw NotFoundException when cockpit not found', async () => {
      const dto: UpdateCockpitPilarDto = { missao: 'Non-existent' };

      mockService.updateCockpit.mockRejectedValue(
        new NotFoundException('Cockpit não encontrado')
      );

      await expect(
        controller.updateCockpit('invalid-cockpit', dto, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCockpit', () => {
    it('should delete cockpit successfully', async () => {
      const deactivatedCockpit = { ...mockCockpit, ativo: false };
      mockService.deleteCockpit.mockResolvedValue(deactivatedCockpit);

      const result = await controller.deleteCockpit('cockpit-1', mockRequest);

      expect(service.deleteCockpit).toHaveBeenCalledWith('cockpit-1', mockUser);
      expect(result).toBe(deactivatedCockpit);
    });

    it('should throw NotFoundException when cockpit not found', async () => {
      mockService.deleteCockpit.mockRejectedValue(
        new NotFoundException('Cockpit não encontrado')
      );

      await expect(
        controller.deleteCockpit('invalid-cockpit', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== INDICADORES ====================

  describe('createIndicador', () => {
    it('should create indicador successfully', async () => {
      const dto: CreateIndicadorCockpitDto = {
        nome: 'New Indicator',
        tipoMedida: 'REAL',
        statusMedicao: 'MEDIDO_CONFIAVEL',
        melhor: 'MAIOR',
        ordem: 1,
      };

      const mockIndicador = {
        id: 'indicador-1',
        nome: 'New Indicator',
        cockpitId: 'cockpit-1',
        ativo: true,
      };

      mockService.createIndicador.mockResolvedValue(mockIndicador);

      const result = await controller.createIndicador('cockpit-1', dto, mockRequest);

      expect(service.createIndicador).toHaveBeenCalledWith('cockpit-1', dto, mockUser);
      expect(result).toBe(mockIndicador);
    });

    it('should throw ConflictException when indicador already exists', async () => {
      const dto: CreateIndicadorCockpitDto = { 
        nome: 'Existing Indicator',
        tipoMedida: 'REAL',
        statusMedicao: 'MEDIDO_CONFIAVEL',
        melhor: 'MAIOR',
      };

      mockService.createIndicador.mockRejectedValue(
        new ConflictException('Já existe indicador com este nome neste cockpit')
      );

      await expect(
        controller.createIndicador('cockpit-1', dto, mockRequest)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateIndicador', () => {
    it('should update indicador successfully', async () => {
      const dto: UpdateIndicadorCockpitDto = {
        nome: 'Updated Indicator',
      };

      const updatedIndicador = {
        id: 'indicador-1',
        nome: 'Updated Indicator',
        unidade: 'KG',
      };

      mockService.updateIndicador.mockResolvedValue(updatedIndicador);

      const result = await controller.updateIndicador('indicador-1', dto, mockRequest);

      expect(service.updateIndicador).toHaveBeenCalledWith('indicador-1', dto, mockUser);
      expect(result).toBe(updatedIndicador);
    });

    it('should throw NotFoundException when indicador not found', async () => {
      const dto: UpdateIndicadorCockpitDto = { nome: 'Non-existent' };

      mockService.updateIndicador.mockRejectedValue(
        new NotFoundException('Indicador não encontrado')
      );

      await expect(
        controller.updateIndicador('invalid-indicador', dto, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteIndicador', () => {
    it('should delete indicador successfully', async () => {
      const deactivatedIndicador = {
        id: 'indicador-1',
        ativo: false,
      };

      mockService.deleteIndicador.mockResolvedValue(deactivatedIndicador);

      const result = await controller.deleteIndicador('indicador-1', mockRequest);

      expect(service.deleteIndicador).toHaveBeenCalledWith('indicador-1', mockUser);
      expect(result).toBe(deactivatedIndicador);
    });

    it('should throw NotFoundException when indicador not found', async () => {
      mockService.deleteIndicador.mockRejectedValue(
        new NotFoundException('Indicador não encontrado')
      );

      await expect(
        controller.deleteIndicador('invalid-indicador', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateValoresMensais', () => {
    it('should update valores mensais successfully', async () => {
      const dto: UpdateValoresMensaisDto = {
        valores: [
          { mes: 1, ano: 2024, meta: 100, realizado: 95 },
          { mes: 2, ano: 2024, meta: 100, realizado: 105 },
        ],
      };

      const updatedValores = {
        indicadorId: 'indicador-1',
        ano: 2024,
        valores: dto.valores,
      };

      mockService.updateValoresMensais.mockResolvedValue(updatedValores);

      const result = await controller.updateValoresMensais('indicador-1', dto, mockRequest);

      expect(service.updateValoresMensais).toHaveBeenCalledWith('indicador-1', dto, mockUser);
      expect(result).toBe(updatedValores);
    });

    it('should throw NotFoundException when indicador not found', async () => {
      const dto: UpdateValoresMensaisDto = { valores: [] };

      mockService.updateValoresMensais.mockRejectedValue(
        new NotFoundException('Indicador não encontrado')
      );

      await expect(
        controller.updateValoresMensais('invalid-indicador', dto, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMesesIndicador', () => {
    it('should return meses of indicador', async () => {
      const mockMeses = [
        { mes: 1, meta: 100, realizado: 95 },
        { mes: 2, meta: 100, realizado: 105 },
      ];

      mockService.getMesesIndicador.mockResolvedValue(mockMeses);

      const result = await controller.getMesesIndicador('indicador-1', 2024, mockRequest);

      expect(service.getMesesIndicador).toHaveBeenCalledWith('indicador-1', 2024, mockUser);
      expect(result).toBe(mockMeses);
    });

    it('should throw NotFoundException when indicador not found', async () => {
      mockService.getMesesIndicador.mockRejectedValue(
        new NotFoundException('Indicador não encontrado')
      );

      await expect(
        controller.getMesesIndicador('invalid-indicador', 2024, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== PROCESSOS PRIORITÁRIOS ====================

  describe('getProcessosPrioritarios', () => {
    it('should return processos prioritários', async () => {
      const mockProcessos = [
        {
          id: 'processo-1',
          nome: 'Processo Test',
          criticidade: 'ALTA',
          nota: 8,
          statusMapeamento: 'CONCLUIDO',
          statusTreinamento: 'EM_ANDAMENTO',
        },
      ];

      mockService.getProcessosPrioritarios.mockResolvedValue(mockProcessos);

      const result = await controller.getProcessosPrioritarios('cockpit-1', mockRequest);

      expect(service.getProcessosPrioritarios).toHaveBeenCalledWith('cockpit-1', mockUser);
      expect(result).toBe(mockProcessos);
    });

    it('should throw NotFoundException when cockpit not found', async () => {
      mockService.getProcessosPrioritarios.mockRejectedValue(
        new NotFoundException('Cockpit não encontrado')
      );

      await expect(
        controller.getProcessosPrioritarios('invalid-cockpit', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProcessoPrioritario', () => {
    it('should update processo prioritario successfully', async () => {
      const dto: UpdateProcessoPrioritarioDto = {
        statusMapeamento: 'CONCLUIDO',
        statusTreinamento: 'EM_ANDAMENTO',
      };

      const updatedProcesso = {
        id: 'processo-1',
        statusMapeamento: 'CONCLUIDO',
        statusTreinamento: 'EM_ANDAMENTO',
      };

      mockService.updateProcessoPrioritario.mockResolvedValue(updatedProcesso);

      const result = await controller.updateProcessoPrioritario('processo-1', dto, mockRequest);

      expect(service.updateProcessoPrioritario).toHaveBeenCalledWith('processo-1', dto, mockUser);
      expect(result).toBe(updatedProcesso);
    });

    it('should throw NotFoundException when processo not found', async () => {
      const dto: UpdateProcessoPrioritarioDto = { 
        statusMapeamento: 'CONCLUIDO',
        statusTreinamento: null,
      };

      mockService.updateProcessoPrioritario.mockRejectedValue(
        new NotFoundException('Processo prioritário não encontrado')
      );

      await expect(
        controller.updateProcessoPrioritario('invalid-processo', dto, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== GRÁFICOS ====================

  describe('getDadosGraficos', () => {
    it('should return dados graficos', async () => {
      const mockDados = {
        indicadores: [
          {
            id: 'indicador-1',
            nome: 'Test Indicator',
            meses: [
              { mes: 1, meta: 100, realizado: 95 },
              { mes: 2, meta: 100, realizado: 105 },
            ],
          },
        ],
      };

      mockService.getDadosGraficos.mockResolvedValue(mockDados);

      const result = await controller.getDadosGraficos(
        'cockpit-1',
        2024,
        undefined,
        mockRequest
      );

      expect(service.getDadosGraficos).toHaveBeenCalledWith(
        'cockpit-1',
        2024,
        mockUser,
        undefined
      );
      expect(result).toBe(mockDados);
    });

    it('should use current year when ano is not provided', async () => {
      const currentYear = new Date().getFullYear();
      mockService.getDadosGraficos.mockResolvedValue({ indicadores: [] });

      await controller.getDadosGraficos('cockpit-1', undefined as any, undefined, mockRequest);

      expect(service.getDadosGraficos).toHaveBeenCalledWith(
        'cockpit-1',
        currentYear,
        mockUser,
        undefined
      );
    });

    it('should throw NotFoundException when cockpit not found', async () => {
      mockService.getDadosGraficos.mockRejectedValue(
        new NotFoundException('Cockpit não encontrado')
      );

      await expect(
        controller.getDadosGraficos('invalid-cockpit', 2024, undefined, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });
});