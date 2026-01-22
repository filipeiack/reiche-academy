import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CockpitPilaresService } from './cockpit-pilares.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * Testes Unitários - Cockpit de Pilares
 * 
 * Baseado nas regras de negócio documentadas em:
 * - /docs/business-rules/cockpit-multi-tenant-seguranca.md
 * - /docs/business-rules/cockpit-gestao-indicadores.md
 * - /docs/business-rules/cockpit-valores-mensais.md
 * - /docs/business-rules/cockpit-processos-prioritarios.md
 * 
 * QA Agent: QA Unitário Estrito
 * Handoff Pattern: /docs/handoffs/2026-01-15-pattern-cockpit-pilares.md (CONFORME)
 */
describe('CockpitPilaresService', () => {
  let service: CockpitPilaresService;
  let prisma: PrismaService;
  let audit: AuditService;

  // Usuários de teste para multi-tenancy
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

  const mockColaboradorEmpresaA = {
    id: 'colab-a-id',
    email: 'colab-a@test.com',
    nome: 'Colaborador A',
    empresaId: 'empresa-a',
    perfil: { codigo: 'COLABORADOR', nivel: 3 },
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

  // =================================================================
  // REGRA: Multi-tenant e Segurança
  // Fonte: /docs/business-rules/cockpit-multi-tenant-seguranca.md
  // =================================================================

  describe('[MULTI-TENANT] validateTenantAccess', () => {
    it('deve permitir acesso global para ADMINISTRADOR', async () => {
      const pilarEmpresa = {
        id: 'pilar-1',
        empresaId: 'empresa-b',
        nome: 'Marketing',
        cockpit: null,
        empresa: { id: 'empresa-b' },
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);
      jest.spyOn(prisma.cockpitPilar, 'create').mockResolvedValue({ id: 'cockpit-1' } as any);
      jest.spyOn(prisma.rotinaEmpresa, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.cockpitPilar, 'findUnique').mockResolvedValue({ 
        id: 'cockpit-1',
        pilarEmpresa,
        indicadores: [],
        processosPrioritarios: []
      } as any);

      // ADMINISTRADOR com empresaId diferente deve ter acesso
      await expect(
        service.createCockpit(
          { pilarEmpresaId: 'pilar-1' },
          mockAdminUser, // empresa-a acessando empresa-b
        ),
      ).resolves.toBeDefined();
    });

    it('deve bloquear acesso entre empresas para GESTOR', async () => {
      const pilarEmpresa = {
        id: 'pilar-1',
        empresaId: 'empresa-b',
        nome: 'Marketing',
        cockpit: null,
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);

      // GESTOR empresa-a tentando acessar empresa-b
      await expect(
        service.createCockpit(
          { pilarEmpresaId: 'pilar-1' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.createCockpit(
          { pilarEmpresaId: 'pilar-1' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow('Você não pode acessar dados de outra empresa');
    });

    it('deve bloquear acesso entre empresas para COLABORADOR', async () => {
      const pilarEmpresa = {
        id: 'pilar-1',
        empresaId: 'empresa-b',
        nome: 'Marketing',
        cockpit: null,
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);

      await expect(
        service.createCockpit(
          { pilarEmpresaId: 'pilar-1' },
          mockColaboradorEmpresaA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve permitir acesso dentro da mesma empresa para GESTOR', async () => {
      const pilarEmpresa = {
        id: 'pilar-1',
        empresaId: 'empresa-a',
        nome: 'Marketing',
        cockpit: null,
        empresa: { id: 'empresa-a' },
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);
      jest.spyOn(prisma.cockpitPilar, 'create').mockResolvedValue({ id: 'cockpit-1' } as any);
      jest.spyOn(prisma.rotinaEmpresa, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.cockpitPilar, 'findUnique').mockResolvedValue({ 
        id: 'cockpit-1',
        pilarEmpresa,
        indicadores: [],
        processosPrioritarios: []
      } as any);

      await expect(
        service.createCockpit(
          { pilarEmpresaId: 'pilar-1' },
          mockGestorEmpresaA,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('[MULTI-TENANT] validateCockpitAccess', () => {
    it('deve lançar NotFoundException se cockpit não existe', async () => {
      jest.spyOn(prisma.cockpitPilar, 'findUnique').mockResolvedValue(null);

      await expect(
        service.getCockpitById('cockpit-inexistente', mockGestorEmpresaA),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.getCockpitById('cockpit-inexistente', mockGestorEmpresaA),
      ).rejects.toThrow('Cockpit não encontrado');
    });

    it('deve permitir ADMINISTRADOR acessar cockpit de qualquer empresa', async () => {
      const cockpit = {
        id: 'cockpit-1',
        pilarEmpresa: {
          empresaId: 'empresa-b',
          empresa: { id: 'empresa-b' },
          pilarTemplate: {},
        },
        indicadores: [],
        processosPrioritarios: [],
      };

      jest.spyOn(prisma.cockpitPilar, 'findUnique').mockResolvedValue(cockpit as any);

      // Admin da empresa-a acessando cockpit da empresa-b
      await expect(
        service.getCockpitById('cockpit-1', mockAdminUser),
      ).resolves.toBeDefined();
    });

    it('deve bloquear GESTOR acessando cockpit de outra empresa', async () => {
      const cockpit = {
        id: 'cockpit-1',
        pilarEmpresa: {
          empresaId: 'empresa-b',
          empresa: { id: 'empresa-b' },
        },
      };

      jest.spyOn(prisma.cockpitPilar, 'findUnique').mockResolvedValue(cockpit as any);

      await expect(
        service.getCockpitById('cockpit-1', mockGestorEmpresaA),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.getCockpitById('cockpit-1', mockGestorEmpresaA),
      ).rejects.toThrow('Você não pode acessar cockpits de outra empresa');
    });
  });

  // =================================================================
  // REGRA: Criação de Cockpit + Auto-vinculação de Rotinas
  // Fonte: /docs/business-rules/cockpit-processos-prioritarios.md
  // =================================================================

  describe('[COCKPIT] createCockpit', () => {
    it('deve criar cockpit e auto-vincular rotinas ativas em ordem', async () => {
      const pilarEmpresa = {
        id: 'pilar-1',
        empresaId: 'empresa-a',
        nome: 'Marketing',
        cockpit: null,
        empresa: { id: 'empresa-a' },
        pilarTemplate: {},
      };

      const rotinasAtivas = [
        { id: 'rot-1', nome: 'Gestão de Leads', ordem: 1, ativo: true },
        { id: 'rot-2', nome: 'Proposta Comercial', ordem: 2, ativo: true },
        { id: 'rot-3', nome: 'Follow-up', ordem: 3, ativo: true },
      ];

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);
      jest.spyOn(prisma.cockpitPilar, 'create').mockResolvedValue({ id: 'cockpit-1' } as any);
      jest.spyOn(prisma.rotinaEmpresa, 'findMany').mockResolvedValue(rotinasAtivas as any);
      jest.spyOn(prisma.processoPrioritario, 'createMany').mockResolvedValue({ count: 3 } as any);
      jest.spyOn(prisma.cockpitPilar, 'findUnique').mockResolvedValue({
        id: 'cockpit-1',
        pilarEmpresa,
        indicadores: [],
        processosPrioritarios: []
      } as any);

      await service.createCockpit({ pilarEmpresaId: 'pilar-1' }, mockGestorEmpresaA);

      // Verificar batch insert de processos prioritários
      expect(prisma.processoPrioritario.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            cockpitPilarId: 'cockpit-1',
            rotinaEmpresaId: 'rot-1',
            ordem: 1,
            createdBy: 'gestor-a-id',
          }),
          expect.objectContaining({
            rotinaEmpresaId: 'rot-2',
            ordem: 2,
          }),
          expect.objectContaining({
            rotinaEmpresaId: 'rot-3',
            ordem: 3,
          }),
        ],
      });

      // Verificar auditoria com quantidade de processos
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'CockpitPilar',
          acao: 'CREATE',
          dadosDepois: expect.objectContaining({
            processosVinculados: 3,
          }),
        }),
      );
    });

    it('deve criar cockpit sem processos se pilar não tem rotinas ativas', async () => {
      const pilarEmpresa = {
        id: 'pilar-1',
        empresaId: 'empresa-a',
        cockpit: null,
        empresa: { id: 'empresa-a' },
        pilarTemplate: {},
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);
      jest.spyOn(prisma.cockpitPilar, 'create').mockResolvedValue({ id: 'cockpit-1' } as any);
      jest.spyOn(prisma.rotinaEmpresa, 'findMany').mockResolvedValue([]); // Sem rotinas
      jest.spyOn(prisma.cockpitPilar, 'findUnique').mockResolvedValue({
        id: 'cockpit-1',
        pilarEmpresa,
        indicadores: [],
        processosPrioritarios: []
      } as any);

      await service.createCockpit({ pilarEmpresaId: 'pilar-1' }, mockGestorEmpresaA);

      // NÃO deve chamar createMany se não há rotinas
      expect(prisma.processoPrioritario.createMany).not.toHaveBeenCalled();
    });

    it('deve impedir criação de cockpit duplicado para mesmo pilar', async () => {
      const pilarEmpresa = {
        id: 'pilar-1',
        empresaId: 'empresa-a',
        cockpit: { id: 'cockpit-existente' }, // Já tem cockpit
      };

      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(pilarEmpresa as any);

      await expect(
        service.createCockpit({ pilarEmpresaId: 'pilar-1' }, mockGestorEmpresaA),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.createCockpit({ pilarEmpresaId: 'pilar-1' }, mockGestorEmpresaA),
      ).rejects.toThrow('Este pilar já possui um cockpit');
    });

    it('deve lançar NotFoundException se pilar não existe', async () => {
      jest.spyOn(prisma.pilarEmpresa, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createCockpit({ pilarEmpresaId: 'pilar-inexistente' }, mockGestorEmpresaA),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.createCockpit({ pilarEmpresaId: 'pilar-inexistente' }, mockGestorEmpresaA),
      ).rejects.toThrow('Pilar não encontrado');
    });
  });

  // =================================================================
  // REGRA: Gestão de Indicadores
  // Fonte: /docs/business-rules/cockpit-gestao-indicadores.md
  // =================================================================

  describe('[INDICADORES] createIndicador', () => {
    it('deve criar indicador com 13 meses (12 mensais + 1 anual)', async () => {
      const cockpit = {
        id: 'cockpit-1',
        pilarEmpresa: {
          empresa: { id: 'empresa-a' },
        },
      };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue(null); // Nome único
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValueOnce(null); // Ordem vazia
      jest.spyOn(prisma.indicadorCockpit, 'create').mockResolvedValue({
        id: 'ind-1',
        nome: 'Faturamento Total',
        ordem: 1,
      } as any);
      jest.spyOn(prisma.indicadorMensal, 'createMany').mockResolvedValue({ count: 13 } as any);
      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue({
        id: 'ind-1',
        mesesIndicador: [],
      } as any);

      await service.createIndicador(
        'cockpit-1',
        {
          nome: 'Faturamento Total',
          tipoMedida: 'REAL' as any,
          statusMedicao: 'NAO_MEDIDO' as any,
          melhor: 'MAIOR' as any,
        },
        mockGestorEmpresaA,
      );

      // Verificar criação de 13 meses
      const createManyCall = (prisma.indicadorMensal.createMany as jest.Mock).mock.calls[0][0];
      expect(createManyCall.data).toHaveLength(13);

      // Verificar meses 1-12
      expect(createManyCall.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ mes: 1, ano: expect.any(Number) }),
          expect.objectContaining({ mes: 6, ano: expect.any(Number) }),
          expect.objectContaining({ mes: 12, ano: expect.any(Number) }),
          expect.objectContaining({ mes: null, ano: expect.any(Number) }), // Anual
        ]),
      );
    });

    it('deve calcular ordem automaticamente como maxOrdem + 1', async () => {
      const cockpit = { id: 'cockpit-1', pilarEmpresa: { empresa: { id: 'empresa-a' } } };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValueOnce(null); // Nome único
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValueOnce({ ordem: 5 } as any); // Max ordem
      jest.spyOn(prisma.indicadorCockpit, 'create').mockResolvedValue({ id: 'ind-1' } as any);
      jest.spyOn(prisma.indicadorMensal, 'createMany').mockResolvedValue({ count: 13 } as any);
      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue({ id: 'ind-1' } as any);

      await service.createIndicador(
        'cockpit-1',
        {
          nome: 'Novo Indicador',
          tipoMedida: 'QUANTIDADE' as any,
          statusMedicao: 'NAO_MEDIDO' as any,
          melhor: 'MAIOR' as any,
        },
        mockGestorEmpresaA,
      );

      expect(prisma.indicadorCockpit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ordem: 6, // 5 + 1
        }),
      });
    });

    it('deve usar ordem 1 se for primeiro indicador do cockpit', async () => {
      const cockpit = { id: 'cockpit-1', pilarEmpresa: { empresa: { id: 'empresa-a' } } };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValueOnce(null); // Sem max ordem
      jest.spyOn(prisma.indicadorCockpit, 'create').mockResolvedValue({ id: 'ind-1' } as any);
      jest.spyOn(prisma.indicadorMensal, 'createMany').mockResolvedValue({ count: 13 } as any);
      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue({ id: 'ind-1' } as any);

      await service.createIndicador(
        'cockpit-1',
        {
          nome: 'Primeiro Indicador',
          tipoMedida: 'REAL' as any,
          statusMedicao: 'NAO_MEDIDO' as any,
          melhor: 'MAIOR' as any,
        },
        mockGestorEmpresaA,
      );

      expect(prisma.indicadorCockpit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ordem: 1,
        }),
      });
    });

    it('deve validar nome único por cockpit (case-sensitive)', async () => {
      const cockpit = { id: 'cockpit-1', pilarEmpresa: { empresa: { id: 'empresa-a' } } };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue({
        id: 'ind-existente',
        nome: 'Faturamento Mensal',
        ativo: true,
      } as any);

      await expect(
        service.createIndicador(
          'cockpit-1',
          {
            nome: 'Faturamento Mensal', // Nome duplicado
            tipoMedida: 'REAL' as any,
            statusMedicao: 'NAO_MEDIDO' as any,
            melhor: 'MAIOR' as any,
          },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.createIndicador(
          'cockpit-1',
          {
            nome: 'Faturamento Mensal',
            tipoMedida: 'REAL' as any,
            statusMedicao: 'NAO_MEDIDO' as any,
            melhor: 'MAIOR' as any,
          },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow('Já existe um indicador com este nome neste cockpit');
    });

    it('deve validar que responsável pertence à mesma empresa do cockpit', async () => {
      const cockpit = {
        id: 'cockpit-1',
        pilarEmpresa: {
          empresa: { id: 'empresa-a' },
        },
      };

      const responsavelOutraEmpresa = {
        id: 'user-b',
        empresaId: 'empresa-b',
      };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(responsavelOutraEmpresa as any);

      await expect(
        service.createIndicador(
          'cockpit-1',
          {
            nome: 'Indicador',
            tipoMedida: 'REAL' as any,
            statusMedicao: 'NAO_MEDIDO' as any,
            melhor: 'MAIOR' as any,
            responsavelMedicaoId: 'user-b',
          },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.createIndicador(
          'cockpit-1',
          {
            nome: 'Indicador',
            tipoMedida: 'REAL' as any,
            statusMedicao: 'NAO_MEDIDO' as any,
            melhor: 'MAIOR' as any,
            responsavelMedicaoId: 'user-b',
          },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow('Responsável deve ser da mesma empresa do cockpit');
    });

    it('deve permitir ADMINISTRADOR atribuir responsável de outra empresa', async () => {
      const cockpit = {
        id: 'cockpit-1',
        pilarEmpresa: {
          empresa: { id: 'empresa-a' },
        },
      };

      const responsavel = {
        id: 'user-b',
        empresaId: 'empresa-b',
      };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(responsavel as any);
      jest.spyOn(prisma.indicadorCockpit, 'create').mockResolvedValue({ id: 'ind-1' } as any);
      jest.spyOn(prisma.indicadorMensal, 'createMany').mockResolvedValue({ count: 13 } as any);
      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue({ id: 'ind-1' } as any);

      // Admin pode atribuir responsável de qualquer empresa
      await expect(
        service.createIndicador(
          'cockpit-1',
          {
            nome: 'Indicador',
            tipoMedida: 'REAL' as any,
            statusMedicao: 'NAO_MEDIDO' as any,
            melhor: 'MAIOR' as any,
            responsavelMedicaoId: 'user-b',
          },
          mockAdminUser,
        ),
      ).resolves.toBeDefined();
    });

    it('deve lançar NotFoundException se responsável não existe', async () => {
      const cockpit = { id: 'cockpit-1', pilarEmpresa: { empresa: { id: 'empresa-a' } } };

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null); // Não existe

      await expect(
        service.createIndicador(
          'cockpit-1',
          {
            nome: 'Indicador',
            tipoMedida: 'REAL' as any,
            statusMedicao: 'NAO_MEDIDO' as any,
            melhor: 'MAIOR' as any,
            responsavelMedicaoId: 'user-inexistente',
          },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.createIndicador(
          'cockpit-1',
          {
            nome: 'Indicador',
            tipoMedida: 'REAL' as any,
            statusMedicao: 'NAO_MEDIDO' as any,
            melhor: 'MAIOR' as any,
            responsavelMedicaoId: 'user-inexistente',
          },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow('Responsável não encontrado');
    });
  });

  describe('[INDICADORES] updateIndicador', () => {
    it('deve atualizar indicador e validar nome único se alterado', async () => {
      const indicador = {
        id: 'ind-1',
        nome: 'Nome Original',
        cockpitPilarId: 'cockpit-1',
        cockpitPilar: {
          pilarEmpresa: {
            empresa: { id: 'empresa-a' },
          },
        },
      };

      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(indicador as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue(null); // Nome novo é único
      jest.spyOn(prisma.indicadorCockpit, 'update').mockResolvedValue({
        ...indicador,
        nome: 'Novo Nome',
      } as any);

      await service.updateIndicador(
        'ind-1',
        { nome: 'Novo Nome' },
        mockGestorEmpresaA,
      );

      expect(prisma.indicadorCockpit.update).toHaveBeenCalledWith({
        where: { id: 'ind-1' },
        data: expect.objectContaining({
          nome: 'Novo Nome',
          updatedBy: 'gestor-a-id',
        }),
      });
    });

    it('deve bloquear alteração de nome para nome já existente no mesmo cockpit', async () => {
      const indicador = {
        id: 'ind-1',
        nome: 'Nome Original',
        cockpitPilarId: 'cockpit-1',
        cockpitPilar: {
          pilarEmpresa: {
            empresa: { id: 'empresa-a' },
          },
        },
      };

      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(indicador as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.indicadorCockpit, 'findFirst').mockResolvedValue({
        id: 'ind-outro',
        nome: 'Nome Duplicado',
      } as any);

      await expect(
        service.updateIndicador(
          'ind-1',
          { nome: 'Nome Duplicado' },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('deve permitir atualizar sem mudar nome (não valida unicidade)', async () => {
      const indicador = {
        id: 'ind-1',
        nome: 'Nome Original',
        cockpitPilarId: 'cockpit-1',
        cockpitPilar: {
          pilarEmpresa: {
            empresa: { id: 'empresa-a' },
          },
        },
      };

      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(indicador as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.indicadorCockpit, 'update').mockResolvedValue({ ...indicador, ordem: 2 } as any);

      await service.updateIndicador(
        'ind-1',
        { ordem: 2 }, // Sem alterar nome
        mockGestorEmpresaA,
      );

      // NÃO deve chamar findFirst para validar nome
      expect(prisma.indicadorCockpit.findFirst).not.toHaveBeenCalled();
      expect(prisma.indicadorCockpit.update).toHaveBeenCalled();
    });
  });

  describe('[INDICADORES] deleteIndicador', () => {
    it('deve fazer soft delete (ativo = false)', async () => {
      const indicador = {
        id: 'ind-1',
        nome: 'Indicador',
        cockpitPilarId: 'cockpit-1',
        ativo: true,
      };

      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(indicador as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.indicadorCockpit, 'update').mockResolvedValue({
        ...indicador,
        ativo: false,
      } as any);

      await service.deleteIndicador('ind-1', mockGestorEmpresaA);

      expect(prisma.indicadorCockpit.update).toHaveBeenCalledWith({
        where: { id: 'ind-1' },
        data: {
          ativo: false,
          updatedBy: 'gestor-a-id',
        },
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'IndicadorCockpit',
          acao: 'DELETE',
        }),
      );
    });

    it('deve lançar NotFoundException se indicador não existe', async () => {
      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(null);

      await expect(
        service.deleteIndicador('ind-inexistente', mockGestorEmpresaA),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =================================================================
  // REGRA: Valores Mensais - Batch Update e Upsert
  // Fonte: /docs/business-rules/cockpit-valores-mensais.md
  // =================================================================

  describe('[VALORES MENSAIS] updateValoresMensais', () => {
    it('deve atualizar valores existentes via UPDATE', async () => {
      const indicador = {
        id: 'ind-1',
        cockpitPilarId: 'cockpit-1',
      };

      const mesExistente = {
        id: 'mes-1',
        ano: 2026,
        mes: 1,
        meta: 1000,
        realizado: 900,
      };

      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(indicador as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.indicadorMensal, 'findFirst').mockResolvedValue(mesExistente as any);
      jest.spyOn(prisma.indicadorMensal, 'update').mockResolvedValue({
        ...mesExistente,
        meta: 1500,
        realizado: 1350,
      } as any);
      jest.spyOn(prisma.indicadorMensal, 'findMany').mockResolvedValue([]);

      await service.updateValoresMensais(
        'ind-1',
        {
          valores: [
            { ano: 2026, mes: 1, meta: 1500, realizado: 1350 },
          ],
        },
        mockGestorEmpresaA,
      );

      expect(prisma.indicadorMensal.update).toHaveBeenCalledWith({
        where: { id: 'mes-1' },
        data: expect.objectContaining({
          meta: 1500,
          realizado: 1350,
          updatedBy: 'gestor-a-id',
        }),
      });
    });

    it('deve criar novo mês via CREATE se não existe (upsert)', async () => {
      const indicador = {
        id: 'ind-1',
        cockpitPilarId: 'cockpit-1',
      };

      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(indicador as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.indicadorMensal, 'findFirst').mockResolvedValue(null); // Não existe
      jest.spyOn(prisma.indicadorMensal, 'create').mockResolvedValue({
        id: 'mes-novo',
        ano: 2027,
        mes: 5,
        meta: 2000,
      } as any);
      jest.spyOn(prisma.indicadorMensal, 'findMany').mockResolvedValue([]);

      await service.updateValoresMensais(
        'ind-1',
        {
          valores: [
            { ano: 2027, mes: 5, meta: 2000 },
          ],
        },
        mockGestorEmpresaA,
      );

      expect(prisma.indicadorMensal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          indicadorCockpitId: 'ind-1',
          ano: 2027,
          mes: 5,
          meta: 2000,
          createdBy: 'gestor-a-id',
        }),
      });
    });

    it('deve processar múltiplos valores em batch', async () => {
      const indicador = { id: 'ind-1', cockpitPilarId: 'cockpit-1' };

      const mes1 = { id: 'mes-1', ano: 2026, mes: 1 };
      const mes2 = { id: 'mes-2', ano: 2026, mes: 2 };

      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(indicador as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.indicadorMensal, 'findFirst')
        .mockResolvedValueOnce(mes1 as any)
        .mockResolvedValueOnce(mes2 as any)
        .mockResolvedValueOnce(null); // Terceiro não existe
      jest.spyOn(prisma.indicadorMensal, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.indicadorMensal, 'create').mockResolvedValue({} as any);
      jest.spyOn(prisma.indicadorMensal, 'findMany').mockResolvedValue([]);

      await service.updateValoresMensais(
        'ind-1',
        {
          valores: [
            { ano: 2026, mes: 1, meta: 1500 },
            { ano: 2026, mes: 2, meta: 1600 },
            { ano: 2026, mes: 3, meta: 1700 }, // Novo
          ],
        },
        mockGestorEmpresaA,
      );

      expect(prisma.indicadorMensal.update).toHaveBeenCalledTimes(2);
      expect(prisma.indicadorMensal.create).toHaveBeenCalledTimes(1);
      expect(audit.log).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se indicador não existe', async () => {
      jest.spyOn(prisma.indicadorCockpit, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateValoresMensais(
          'ind-inexistente',
          { valores: [{ ano: 2026, mes: 1, meta: 1000 }] },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =================================================================
  // REGRA: Processos Prioritários
  // Fonte: /docs/business-rules/cockpit-processos-prioritarios.md
  // =================================================================

  describe('[PROCESSOS] getProcessosPrioritarios', () => {
    it('deve retornar processos com nota mais recente da rotina', async () => {
      const cockpit = { id: 'cockpit-1' };
      const processos = [
        {
          id: 'proc-1',
          rotinaEmpresa: {
            id: 'rot-1',
            nome: 'Rotina 1',
            notas: [
              { id: 'nota-1', nota: 8.5, criticidade: 'ALTA', createdAt: new Date('2026-01-20') },
            ],
          },
        },
      ];

      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue(cockpit);
      jest.spyOn(prisma.processoPrioritario, 'findMany').mockResolvedValue(processos as any);

      const resultado = await service.getProcessosPrioritarios('cockpit-1', mockGestorEmpresaA);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].rotinaEmpresa.notas).toHaveLength(1); // Apenas última nota
    });
  });

  describe('[PROCESSOS] updateProcessoPrioritario', () => {
    it('deve atualizar statusMapeamento e statusTreinamento', async () => {
      const processo = {
        id: 'proc-1',
        cockpitPilarId: 'cockpit-1',
        rotinaEmpresa: {},
      };

      jest.spyOn(prisma.processoPrioritario, 'findUnique').mockResolvedValue(processo as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.processoPrioritario, 'update').mockResolvedValue({
        ...processo,
        statusMapeamento: 'CONCLUIDO',
        statusTreinamento: 'EM_ANDAMENTO',
      } as any);

      await service.updateProcessoPrioritario(
        'proc-1',
        {
          statusMapeamento: 'CONCLUIDO' as any,
          statusTreinamento: 'EM_ANDAMENTO' as any,
        },
        mockGestorEmpresaA,
      );

      expect(prisma.processoPrioritario.update).toHaveBeenCalledWith({
        where: { id: 'proc-1' },
        data: expect.objectContaining({
          statusMapeamento: 'CONCLUIDO',
          statusTreinamento: 'EM_ANDAMENTO',
          updatedBy: 'gestor-a-id',
        }),
        include: expect.anything(),
      });

      expect(audit.log).toHaveBeenCalled();
    });

    it('deve permitir valores null (clearable)', async () => {
      const processo = {
        id: 'proc-1',
        cockpitPilarId: 'cockpit-1',
        statusMapeamento: 'CONCLUIDO',
        rotinaEmpresa: {},
      };

      jest.spyOn(prisma.processoPrioritario, 'findUnique').mockResolvedValue(processo as any);
      jest.spyOn(service as any, 'validateCockpitAccess').mockResolvedValue({});
      jest.spyOn(prisma.processoPrioritario, 'update').mockResolvedValue({
        ...processo,
        statusMapeamento: null,
      } as any);

      await service.updateProcessoPrioritario(
        'proc-1',
        { 
          statusMapeamento: null,
          statusTreinamento: null 
        },
        mockGestorEmpresaA,
      );

      expect(prisma.processoPrioritario.update).toHaveBeenCalledWith({
        where: { id: 'proc-1' },
        data: expect.objectContaining({
          statusMapeamento: null,
        }),
        include: expect.anything(),
      });
    });

    it('deve lançar NotFoundException se processo não existe', async () => {
      jest.spyOn(prisma.processoPrioritario, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateProcessoPrioritario(
          'proc-inexistente',
          { 
            statusMapeamento: 'CONCLUIDO' as any,
            statusTreinamento: null 
          },
          mockGestorEmpresaA,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
