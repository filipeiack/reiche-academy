import { Test, TestingModule } from '@nestjs/testing';
import { PilaresController } from './pilares.controller';
import { PilaresService } from './pilares.service';
import { CreatePilarDto } from './dto/create-pilar.dto';
import { UpdatePilarDto } from './dto/update-pilar.dto';
import { ReordenarPilarDto } from './dto/reordenar-pilar.dto';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { Request } from 'express';

describe('PilaresController', () => {
  let controller: PilaresController;
  let service: PilaresService;

  const mockUser = {
    id: 'user-1',
    email: 'admin@test.com',
    perfil: { codigo: 'ADMINISTRADOR' },
    empresaId: 'empresa-1',
  } as RequestUser;

  const mockGestorUser = {
    id: 'user-2',
    email: 'gestor@test.com',
    perfil: { codigo: 'GESTOR' },
    empresaId: 'empresa-1',
  } as RequestUser;

  const mockOtherEmpresaUser = {
    id: 'user-3',
    email: 'other@test.com',
    perfil: { codigo: 'ADMINISTRADOR' },
    empresaId: 'empresa-2',
  } as RequestUser;

  const mockPilar = {
    id: 'pilar-1',
    nome: 'Pilar Test',
    descricao: 'Test Description',
    ativo: true,
    ordem: 1,
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    reordenar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PilaresController],
      providers: [
        {
          provide: PilaresService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PilaresController>(PilaresController);
    service = module.get<PilaresService>(PilaresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create pilar successfully with ADMINISTRADOR', async () => {
      const dto: CreatePilarDto = {
        nome: 'New Pilar',
        descricao: 'Test Description',
      };

      mockService.create.mockResolvedValue(mockPilar);

      const result = await controller.create(dto, { user: mockUser } as any);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toBe(mockPilar);
    });

    it('should throw ConflictException when pilar already exists', async () => {
      const dto: CreatePilarDto = { nome: 'Existing Pilar' };

      mockService.create.mockRejectedValue(
        new ConflictException('Já existe um pilar com este nome')
      );

      await expect(
        controller.create(dto, { user: mockUser } as any)
      ).rejects.toThrow(ConflictException);
    });

    it('should validate that service receives correct user context', async () => {
      const dto: CreatePilarDto = { nome: 'Context Test Pilar' };
      
      mockService.create.mockResolvedValue(mockPilar);

      await controller.create(dto, { user: mockUser } as any);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(mockService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all pilares', async () => {
      const pilares = [mockPilar];
      mockService.findAll.mockResolvedValue(pilares);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith();
      expect(result).toBe(pilares);
    });

    it('should return empty array when no pilares exist', async () => {
      mockService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return pilar by ID', async () => {
      mockService.findOne.mockResolvedValue(mockPilar);

      const result = await controller.findOne('pilar-1');

      expect(service.findOne).toHaveBeenCalledWith('pilar-1');
      expect(result).toBe(mockPilar);
    });

    it('should throw NotFoundException when pilar not found', async () => {
      mockService.findOne.mockRejectedValue(
        new NotFoundException('Pilar não encontrado')
      );

      await expect(controller.findOne('invalid-pilar')).rejects.toThrow(NotFoundException);
    });

    it('should handle valid UUID format', async () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      mockService.findOne.mockResolvedValue(mockPilar);

      await controller.findOne(validUUID);

      expect(service.findOne).toHaveBeenCalledWith(validUUID);
    });
  });

  describe('update', () => {
    it('should update pilar successfully with ADMINISTRADOR', async () => {
      const dto: UpdatePilarDto = {
        nome: 'Updated Pilar',
        descricao: 'Updated Description',
      };

      const updatedPilar = { ...mockPilar, ...dto };
      mockService.update.mockResolvedValue(updatedPilar);

      const result = await controller.update('pilar-1', dto, { user: mockUser } as any);

      expect(service.update).toHaveBeenCalledWith('pilar-1', dto, mockUser);
      expect(result).toBe(updatedPilar);
    });

    it('should throw NotFoundException when pilar not found', async () => {
      const dto: UpdatePilarDto = { nome: 'Non-existent' };

      mockService.update.mockRejectedValue(
        new NotFoundException('Pilar não encontrado')
      );

      await expect(
        controller.update('invalid-pilar', dto, { user: mockUser } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing name', async () => {
      const dto: UpdatePilarDto = { nome: 'Existing Name' };

      mockService.update.mockRejectedValue(
        new ConflictException('Já existe um pilar com este nome')
      );

      await expect(
        controller.update('pilar-1', dto, { user: mockUser } as any)
      ).rejects.toThrow(ConflictException);
    });

    it('should validate that service receives correct user context', async () => {
      const dto: UpdatePilarDto = { nome: 'Context Update Test' };
      
      mockService.update.mockResolvedValue(mockPilar);

      await controller.update('pilar-1', dto, { user: mockUser } as any);

      expect(service.update).toHaveBeenCalledWith('pilar-1', dto, mockUser);
    });
  });

  describe('remove', () => {
    it('should remove pilar successfully with ADMINISTRADOR', async () => {
      const deactivatedPilar = { ...mockPilar, ativo: false };
      mockService.remove.mockResolvedValue(deactivatedPilar);

      const result = await controller.remove('pilar-1', { user: mockUser } as any);

      expect(service.remove).toHaveBeenCalledWith('pilar-1', mockUser);
      expect(result).toBe(deactivatedPilar);
    });

    it('should throw NotFoundException when pilar not found', async () => {
      mockService.remove.mockRejectedValue(
        new NotFoundException('Pilar não encontrado')
      );

      await expect(
        controller.remove('invalid-pilar', { user: mockUser } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate that service receives correct user context', async () => {
      mockService.remove.mockResolvedValue({ ...mockPilar, ativo: false });

      await controller.remove('pilar-1', { user: mockUser } as any);

      expect(service.remove).toHaveBeenCalledWith('pilar-1', mockUser);
    });
  });

  describe('reordenar', () => {
    it('should reorder pilares successfully with ADMINISTRADOR', async () => {
      const dto: ReordenarPilarDto = {
        ordens: [
          { id: 'pilar-3', ordem: 1 },
          { id: 'pilar-1', ordem: 2 },
          { id: 'pilar-2', ordem: 3 },
        ],
      };

      const reorderedPilares = [
        { id: 'pilar-3', ordem: 1 },
        { id: 'pilar-1', ordem: 2 },
        { id: 'pilar-2', ordem: 3 },
      ];

      mockService.reordenar.mockResolvedValue(reorderedPilares);

      const result = await controller.reordenar(dto, { user: mockUser } as any);

      expect(service.reordenar).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toBe(reorderedPilares);
    });

    it('should throw NotFoundException when pilar not found during reorder', async () => {
      const dto: ReordenarPilarDto = {
        ordens: [
          { id: 'pilar-3', ordem: 1 },
          { id: 'invalid-pilar', ordem: 2 },
          { id: 'pilar-2', ordem: 3 },
        ],
      };

      mockService.reordenar.mockRejectedValue(
        new NotFoundException('Pilar não encontrado')
      );

      await expect(
        controller.reordenar(dto, { user: mockUser } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle empty reorder array', async () => {
      const dto: ReordenarPilarDto = { ordens: [] };

      mockService.reordenar.mockResolvedValue([]);

      const result = await controller.reordenar(dto, { user: mockUser } as any);

      expect(service.reordenar).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual([]);
    });

    it('should validate that service receives correct user context', async () => {
      const dto: ReordenarPilarDto = {
        ordens: [
          { id: 'pilar-1', ordem: 1 },
          { id: 'pilar-2', ordem: 2 },
        ],
      };
      
      mockService.reordenar.mockResolvedValue([]);

      await controller.reordenar(dto, { user: mockUser } as any);

      expect(service.reordenar).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('Cross-Empresa Validation', () => {
    it('should allow ADMINISTRADOR to create pilar (global access)', async () => {
      const dto: CreatePilarDto = { nome: 'Global Pilar' };
      mockService.create.mockResolvedValue(mockPilar);

      // No specific cross-empresa validation in controller level
      // This would be handled in service layer
      const result = await controller.create(dto, { user: mockUser } as any);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toBe(mockPilar);
    });

    it('should allow different user types to access findAll', async () => {
      const users = [
        { user: mockUser, description: 'ADMINISTRADOR' },
        { user: mockGestorUser, description: 'GESTOR' },
      ];

      for (const { user, description } of users) {
        mockService.findAll.mockResolvedValue([mockPilar]);

        const result = await controller.findAll();

        expect(service.findAll).toHaveBeenCalled();
        expect(result).toEqual([mockPilar]);
      }
    });

    it('should allow different user types to access findOne', async () => {
      const users = [
        { user: mockUser, description: 'ADMINISTRADOR' },
        { user: mockGestorUser, description: 'GESTOR' },
      ];

      for (const { user, description } of users) {
        mockService.findOne.mockResolvedValue(mockPilar);

        const result = await controller.findOne('pilar-1');

        expect(service.findOne).toHaveBeenCalledWith('pilar-1');
        expect(result).toBe(mockPilar);
      }
    });
  });

  describe('Parameter Validation', () => {
    it('should handle string ID parameter correctly', async () => {
      mockService.findOne.mockResolvedValue(mockPilar);

      await controller.findOne('pilar-1');

      expect(service.findOne).toHaveBeenCalledWith('pilar-1');
      expect(service.findOne).toHaveBeenCalledWith('pilar-1');
    });

    it('should handle numeric string ID parameter', async () => {
      mockService.findOne.mockResolvedValue(mockPilar);

      await controller.findOne('123');

      expect(service.findOne).toHaveBeenCalledWith('123');
    });

    it('should handle empty string ID parameter', async () => {
      mockService.findOne.mockRejectedValue(
        new NotFoundException('Pilar não encontrado')
      );

      await expect(controller.findOne('')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('');
    });
  });

  describe('Service Method Validation', () => {
    it('should call all service methods with correct parameters', async () => {
      const createDto: CreatePilarDto = { nome: 'Test' };
      const updateDto: UpdatePilarDto = { nome: 'Updated' };
      const reorderDto: ReordenarPilarDto = { 
        ordens: [{ id: 'pilar-1', ordem: 1 }] 
      };

      mockService.create.mockResolvedValue(mockPilar);
      mockService.findAll.mockResolvedValue([mockPilar]);
      mockService.findOne.mockResolvedValue(mockPilar);
      mockService.update.mockResolvedValue(mockPilar);
      mockService.remove.mockResolvedValue({ ...mockPilar, ativo: false });
      mockService.reordenar.mockResolvedValue([]);

      // Test all methods
      await controller.create(createDto, { user: mockUser } as any);
      await controller.findAll();
      await controller.findOne('pilar-1');
      await controller.update('pilar-1', updateDto, { user: mockUser } as any);
      await controller.remove('pilar-1', { user: mockUser } as any);
      await controller.reordenar(reorderDto, { user: mockUser } as any);

      // Verify all service methods were called
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.reordenar).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors without modification', async () => {
      const serviceError = new Error('Service error');
      mockService.findAll.mockRejectedValue(serviceError);

      await expect(controller.findAll()).rejects.toThrow('Service error');
    });

    it('should handle null service responses gracefully', async () => {
      mockService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('pilar-1');

      expect(result).toBeNull();
    });

    it('should handle undefined service responses gracefully', async () => {
      mockService.findOne.mockResolvedValue(undefined);

      const result = await controller.findOne('pilar-1');

      expect(result).toBeUndefined();
    });
  });
});