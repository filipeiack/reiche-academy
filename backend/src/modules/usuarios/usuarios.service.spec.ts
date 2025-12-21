import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('UsuariosService - Regras de Negócio e Segurança', () => {
  let service: UsuariosService;
  let prisma: PrismaService;
  let audit: AuditService;

  // Mocks de usuários para testes
  const mockAdminUser = {
    id: 'admin-id',
    email: 'admin@test.com',
    nome: 'Admin User',
    empresaId: 'empresa-a',
    perfil: { id: 'perfil-admin', codigo: 'ADMINISTRADOR', nome: 'Administrador', nivel: 1 },
  };

  const mockGestorEmpresaA = {
    id: 'gestor-a-id',
    email: 'gestor-a@test.com',
    nome: 'Gestor A',
    empresaId: 'empresa-a',
    perfil: { id: 'perfil-gestor', codigo: 'GESTOR', nome: 'Gestor', nivel: 2 },
  };

  const mockGestorEmpresaB = {
    id: 'gestor-b-id',
    email: 'gestor-b@test.com',
    nome: 'Gestor B',
    empresaId: 'empresa-b',
    perfil: { id: 'perfil-gestor', codigo: 'GESTOR', nome: 'Gestor', nivel: 2 },
  };

  const mockColaboradorEmpresaA = {
    id: 'colab-a-id',
    email: 'colab-a@test.com',
    nome: 'Colaborador A',
    empresaId: 'empresa-a',
    perfil: { id: 'perfil-colab', codigo: 'COLABORADOR', nome: 'Colaborador', nivel: 3 },
  };

  const mockUsuarioEmpresaB = {
    id: 'user-b-id',
    email: 'user-b@test.com',
    nome: 'Usuario B',
    cargo: 'Analista',
    empresaId: 'empresa-b',
    fotoUrl: null,
    ativo: true,
    perfil: { id: 'perfil-colab', codigo: 'COLABORADOR', nome: 'Colaborador', nivel: 3 },
  };

  const mockPerfilAdmin = {
    id: 'perfil-admin',
    codigo: 'ADMINISTRADOR',
    nome: 'Administrador',
    nivel: 1,
  };

  const mockPerfilGestor = {
    id: 'perfil-gestor',
    codigo: 'GESTOR',
    nome: 'Gestor',
    nivel: 2,
  };

  const mockPerfilColaborador = {
    id: 'perfil-colab',
    codigo: 'COLABORADOR',
    nome: 'Colaborador',
    nivel: 3,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: PrismaService,
          useValue: {
            usuario: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            perfilUsuario: {
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

    service = module.get<UsuariosService>(UsuariosService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  describe('RA-001: Isolamento Multi-Tenant', () => {
    it('deve permitir ADMINISTRADOR acessar usuário de qualquer empresa', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUsuarioEmpresaB as any);

      const result = await service.findById('user-b-id', mockAdminUser);

      expect(result).toBeDefined();
      expect(result.id).toBe('user-b-id');
    });

    it('deve bloquear GESTOR de acessar usuário de outra empresa', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUsuarioEmpresaB as any);

      await expect(
        service.findById('user-b-id', mockGestorEmpresaA)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.findById('user-b-id', mockGestorEmpresaA)
      ).rejects.toThrow('Você não pode visualizar usuários de outra empresa');
    });

    it('deve permitir GESTOR acessar usuário da mesma empresa', async () => {
      const usuarioMesmaEmpresa = {
        ...mockUsuarioEmpresaB,
        empresaId: 'empresa-a',
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioMesmaEmpresa as any);

      const result = await service.findById('user-b-id', mockGestorEmpresaA);

      expect(result).toBeDefined();
      expect(result.empresaId).toBe('empresa-a');
    });

    it('deve bloquear GESTOR de editar usuário de outra empresa', async () => {
      const usuarioOutraEmpresa = { ...mockUsuarioEmpresaB, empresaId: 'empresa-b' };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioOutraEmpresa as any);

      await expect(
        service.update('user-b-id', { nome: 'Novo Nome' }, mockGestorEmpresaA)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update('user-b-id', { nome: 'Novo Nome' }, mockGestorEmpresaA)
      ).rejects.toThrow('Você não pode editar usuários de outra empresa');
    });

    it('deve bloquear COLABORADOR de alterar foto de usuário de outra empresa', async () => {
      const usuarioOutraEmpresa = { ...mockUsuarioEmpresaB, empresaId: 'empresa-b' };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioOutraEmpresa as any);

      await expect(
        service.updateProfilePhoto('user-b-id', '/images/faces/foto.jpg', mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('RA-002: Bloqueio de Auto-Edição Privilegiada', () => {
    it('deve bloquear usuário de alterar próprio perfilId', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, empresaId: 'empresa-a' };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);

      await expect(
        service.update('colab-a-id', { perfilId: 'perfil-admin' }, mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update('colab-a-id', { perfilId: 'perfil-admin' }, mockColaboradorEmpresaA)
      ).rejects.toThrow('Você não pode alterar perfilId, empresaId ou ativo no seu próprio usuário');
    });

    it('deve bloquear usuário de alterar próprio empresaId', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, empresaId: 'empresa-a' };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);

      await expect(
        service.update('colab-a-id', { empresaId: 'empresa-b' }, mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve bloquear usuário de alterar próprio campo ativo', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, empresaId: 'empresa-a', ativo: false };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);

      await expect(
        service.update('colab-a-id', { ativo: true }, mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve permitir usuário alterar próprio nome, cargo e senha', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, empresaId: 'empresa-a' };
      const usuarioAtualizado = { ...usuarioAtual, nome: 'Novo Nome', cargo: 'Senior' };
      
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue(usuarioAtualizado as any);

      const result = await service.update(
        'colab-a-id',
        { nome: 'Novo Nome', cargo: 'Senior' },
        mockColaboradorEmpresaA
      );

      expect(result.nome).toBe('Novo Nome');
      expect(prisma.usuario.update).toHaveBeenCalled();
    });

    it('deve permitir ADMINISTRADOR alterar perfilId de outro usuário', async () => {
      const usuarioAlvo = { ...mockColaboradorEmpresaA, empresaId: 'empresa-a' };
      const usuarioAtualizado = { ...usuarioAlvo, perfil: mockPerfilGestor };
      
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAlvo as any);
      jest.spyOn(prisma.perfilUsuario, 'findUnique').mockResolvedValue(mockPerfilGestor as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue(usuarioAtualizado as any);

      const result = await service.update(
        'colab-a-id',
        { perfilId: 'perfil-gestor' },
        mockAdminUser
      );

      expect(result).toBeDefined();
      expect(prisma.usuario.update).toHaveBeenCalled();
    });
  });

  describe('RA-003: Proteção de Recursos (Foto)', () => {
    it('deve permitir usuário alterar própria foto', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, empresaId: 'empresa-a', fotoUrl: null };
      const usuarioAtualizado = { ...usuarioAtual, fotoUrl: '/images/faces/nova-foto.jpg' };
      
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue(usuarioAtualizado as any);

      const result = await service.updateProfilePhoto(
        'colab-a-id',
        '/images/faces/nova-foto.jpg',
        mockColaboradorEmpresaA
      );

      expect(result.fotoUrl).toBe('/images/faces/nova-foto.jpg');
      expect(audit.log).toHaveBeenCalled();
    });

    it('deve bloquear COLABORADOR de alterar foto de outro usuário', async () => {
      const outroUsuario = { ...mockUsuarioEmpresaB, empresaId: 'empresa-a' };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(outroUsuario as any);

      await expect(
        service.updateProfilePhoto('user-b-id', '/images/faces/foto.jpg', mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.updateProfilePhoto('user-b-id', '/images/faces/foto.jpg', mockColaboradorEmpresaA)
      ).rejects.toThrow('Você não pode alterar a foto de outro usuário');
    });

    it('deve permitir ADMINISTRADOR alterar foto de qualquer usuário', async () => {
      const usuarioAlvo = { ...mockUsuarioEmpresaB, fotoUrl: null };
      const usuarioAtualizado = { ...usuarioAlvo, fotoUrl: '/images/faces/nova-foto.jpg' };
      
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAlvo as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue(usuarioAtualizado as any);

      const result = await service.updateProfilePhoto(
        'user-b-id',
        '/images/faces/nova-foto.jpg',
        mockAdminUser
      );

      expect(result.fotoUrl).toBe('/images/faces/nova-foto.jpg');
    });

    it('deve bloquear COLABORADOR de deletar foto de outro usuário', async () => {
      const outroUsuario = { ...mockUsuarioEmpresaB, empresaId: 'empresa-a', fotoUrl: '/images/faces/foto.jpg' };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(outroUsuario as any);

      await expect(
        service.deleteProfilePhoto('user-b-id', mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.deleteProfilePhoto('user-b-id', mockColaboradorEmpresaA)
      ).rejects.toThrow('Você não pode deletar a foto de outro usuário');
    });

    it('deve auditar alterações de foto', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, empresaId: 'empresa-a', fotoUrl: '/images/faces/old.jpg' };
      const usuarioAtualizado = { ...usuarioAtual, fotoUrl: '/images/faces/new.jpg' };
      
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue(usuarioAtualizado as any);

      await service.updateProfilePhoto('colab-a-id', '/images/faces/new.jpg', mockColaboradorEmpresaA);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'usuarios',
          acao: 'UPDATE',
          dadosAntes: { fotoUrl: '/images/faces/old.jpg' },
          dadosDepois: { fotoUrl: '/images/faces/new.jpg' },
        })
      );
    });
  });

  describe('RA-004: Restrição de Elevação de Perfil', () => {
    it('deve bloquear GESTOR de criar usuário com perfil ADMINISTRADOR', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.perfilUsuario, 'findUnique').mockResolvedValue(mockPerfilAdmin as any);

      await expect(
        service.create({
          email: 'novo@test.com',
          nome: 'Novo Admin',
          senha: '123456',
          perfilId: 'perfil-admin',
        }, mockGestorEmpresaA)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.create({
          email: 'novo@test.com',
          nome: 'Novo Admin',
          senha: '123456',
          perfilId: 'perfil-admin',
        }, mockGestorEmpresaA)
      ).rejects.toThrow('Você não pode criar usuário com perfil superior ao seu');
    });

    it('deve permitir GESTOR criar usuário com perfil COLABORADOR', async () => {
      const novoUsuario = {
        id: 'novo-id',
        email: 'novo@test.com',
        nome: 'Novo Colaborador',
        perfil: mockPerfilColaborador,
        empresaId: 'empresa-a',
        ativo: true,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.perfilUsuario, 'findUnique').mockResolvedValue(mockPerfilColaborador as any);
      jest.spyOn(prisma.usuario, 'create').mockResolvedValue(novoUsuario as any);

      const result = await service.create({
        email: 'novo@test.com',
        nome: 'Novo Colaborador',
        senha: '123456',
        perfilId: 'perfil-colab',
      }, mockGestorEmpresaA);

      expect(result).toBeDefined();
      expect(result.email).toBe('novo@test.com');
    });

    it('deve permitir ADMINISTRADOR criar usuário com qualquer perfil', async () => {
      const novoAdmin = {
        id: 'novo-admin-id',
        email: 'novo-admin@test.com',
        nome: 'Novo Admin',
        perfil: mockPerfilAdmin,
        empresaId: 'empresa-a',
        ativo: true,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'create').mockResolvedValue(novoAdmin as any);

      const result = await service.create({
        email: 'novo-admin@test.com',
        nome: 'Novo Admin',
        senha: '123456',
        perfilId: 'perfil-admin',
      }, mockAdminUser);

      expect(result).toBeDefined();
      expect(result.email).toBe('novo-admin@test.com');
    });

    it('deve bloquear GESTOR de promover COLABORADOR para ADMINISTRADOR', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, empresaId: 'empresa-a' };
      
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);
      jest.spyOn(prisma.perfilUsuario, 'findUnique').mockResolvedValue(mockPerfilAdmin as any);

      await expect(
        service.update('colab-a-id', { perfilId: 'perfil-admin' }, mockGestorEmpresaA)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update('colab-a-id', { perfilId: 'perfil-admin' }, mockGestorEmpresaA)
      ).rejects.toThrow('Você não pode atribuir usuário com perfil superior ao seu');
    });

    it('deve bloquear COLABORADOR de criar qualquer usuário (nivel superior)', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.perfilUsuario, 'findUnique').mockResolvedValue(mockPerfilGestor as any);

      await expect(
        service.create({
          email: 'novo@test.com',
          nome: 'Novo Gestor',
          senha: '123456',
          perfilId: 'perfil-gestor',
        }, mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('RN-001: Unicidade de Email', () => {
    it('deve bloquear criação de usuário com email duplicado', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockColaboradorEmpresaA as any);

      await expect(
        service.create({
          email: 'colab-a@test.com',
          nome: 'Duplicado',
          senha: '123456',
          perfilId: 'perfil-colab',
        })
      ).rejects.toThrow(ConflictException);

      await expect(
        service.create({
          email: 'colab-a@test.com',
          nome: 'Duplicado',
          senha: '123456',
          perfilId: 'perfil-colab',
        })
      ).rejects.toThrow('Email já cadastrado');
    });
  });

  describe('Auditoria', () => {
    it('deve auditar criação de usuário', async () => {
      const novoUsuario = {
        id: 'novo-id',
        email: 'novo@test.com',
        nome: 'Novo Usuario',
        perfil: mockPerfilColaborador,
        empresaId: 'empresa-a',
        ativo: true,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'create').mockResolvedValue(novoUsuario as any);

      await service.create({
        email: 'novo@test.com',
        nome: 'Novo Usuario',
        senha: '123456',
        perfilId: 'perfil-colab',
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'usuarios',
          acao: 'CREATE',
        })
      );
    });

    it('deve auditar atualização de usuário', async () => {
      const usuarioAntes = { ...mockColaboradorEmpresaA, empresaId: 'empresa-a' };
      const usuarioDepois = { ...usuarioAntes, nome: 'Nome Atualizado' };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAntes as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue(usuarioDepois as any);

      await service.update('colab-a-id', { nome: 'Nome Atualizado' }, mockAdminUser);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'usuarios',
          acao: 'UPDATE',
        })
      );
    });
  });
});
