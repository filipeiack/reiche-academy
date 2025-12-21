import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as argon2 from 'argon2';

/**
 * QA UNITÁRIO ESTRITO - Suite Completa
 * Valida TODAS as regras de /docs/business-rules/usuarios.md
 * Criado de forma independente da implementação
 */
describe('UsuariosService - Validação Completa de Regras de Negócio', () => {
  let service: UsuariosService;
  let prisma: PrismaService;
  let audit: AuditService;

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

  const mockPerfilAdmin = { id: 'perfil-admin', codigo: 'ADMINISTRADOR', nome: 'Administrador', nivel: 1 };
  const mockPerfilGestor = { id: 'perfil-gestor', codigo: 'GESTOR', nome: 'Gestor', nivel: 2 };
  const mockPerfilColaborador = { id: 'perfil-colab', codigo: 'COLABORADOR', nome: 'Colaborador', nivel: 3 };

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // REGRAS DE NEGÓCIO ORIGINAIS (usuarios.md)
  // ============================================================

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

    it('deve permitir criar usuário com email único', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'create').mockResolvedValue({
        id: 'novo-id',
        email: 'unico@test.com',
      } as any);

      const result = await service.create({
        email: 'unico@test.com',
        nome: 'Novo Usuario',
        senha: '123456',
        perfilId: 'perfil-colab',
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('unico@test.com');
    });
  });

  describe('RN-002: Hash de Senha com Argon2', () => {
    it('deve armazenar senha como hash argon2 ao criar usuário', async () => {
      const senhaPlainText = 'senha123';
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'create').mockResolvedValue({
        id: 'novo-id',
        senha: '$argon2id$hashed',
      } as any);

      await service.create({
        email: 'novo@test.com',
        nome: 'Novo',
        senha: senhaPlainText,
        perfilId: 'perfil-colab',
      });

      const createCall = (prisma.usuario.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.senha).not.toBe(senhaPlainText);
      expect(createCall.data.senha).toMatch(/^\$argon2/);
    });

    it('deve fazer rehash de senha ao atualizar', async () => {
      const novaSenha = 'novaSenha456';
      const usuarioAtual = { ...mockColaboradorEmpresaA };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue({ ...usuarioAtual, senha: '$argon2id$new' } as any);

      await service.update('colab-a-id', { senha: novaSenha }, mockAdminUser);

      const updateCall = (prisma.usuario.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.senha).not.toBe(novaSenha);
      expect(updateCall.data.senha).toMatch(/^\$argon2/);
    });
  });

  describe('RN-003: Redação de Senha em Logs de Auditoria', () => {
    it('deve substituir senha por [REDACTED] ao auditar criação', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usuario, 'create').mockResolvedValue({
        id: 'novo-id',
        email: 'novo@test.com',
        nome: 'Novo',
        senha: '$argon2hash',
        perfil: mockPerfilColaborador,
        ativo: true,
        createdAt: new Date(),
      } as any);

      await service.create({
        email: 'novo@test.com',
        nome: 'Novo',
        senha: 'senha123',
        perfilId: 'perfil-colab',
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosDepois: expect.objectContaining({ senha: '[REDACTED]' }),
        })
      );
    });

    it('deve substituir senha por [REDACTED] ao auditar atualização', async () => {
      const usuarioAntes = { ...mockColaboradorEmpresaA, senha: '$argon2old' };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAntes as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue({ ...usuarioAntes, senha: '$argon2new' } as any);

      await service.update('colab-a-id', { senha: 'novaSenha' }, mockAdminUser);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosAntes: expect.objectContaining({ senha: '[REDACTED]' }),
          dadosDepois: expect.objectContaining({ senha: '[REDACTED]' }),
        })
      );
    });

    it('deve substituir senha por [REDACTED] ao auditar soft delete', async () => {
      const usuario = { ...mockColaboradorEmpresaA, senha: '$argon2hash' };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuario as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue({ ...usuario, ativo: false } as any);

      await service.remove('colab-a-id');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosAntes: expect.objectContaining({ senha: '[REDACTED]' }),
          dadosDepois: expect.objectContaining({ senha: '[REDACTED]' }),
        })
      );
    });

    it('deve substituir senha por [REDACTED] ao auditar hard delete', async () => {
      const usuario = { ...mockColaboradorEmpresaA, senha: '$argon2hash', fotoUrl: null };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuario as any);
      jest.spyOn(prisma.usuario, 'delete').mockResolvedValue({} as any);

      await service.hardDelete('colab-a-id');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosAntes: expect.objectContaining({ senha: '[REDACTED]' }),
        })
      );
    });
  });

  describe('RN-004: Usuários Disponíveis para Associação', () => {
    it('deve retornar apenas usuários com empresaId null e ativo true', async () => {
      const mockDisponiveis = [
        { id: '1', empresaId: null, ativo: true, nome: 'User 1' },
        { id: '2', empresaId: null, ativo: true, nome: 'User 2' },
      ];

      jest.spyOn(prisma.usuario, 'findMany').mockResolvedValue(mockDisponiveis as any);

      const result = await service.findDisponiveis();

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { empresaId: null, ativo: true },
        })
      );
      expect(result).toHaveLength(2);
    });

    it('NÃO deve retornar usuários inativos', async () => {
      jest.spyOn(prisma.usuario, 'findMany').mockResolvedValue([]);

      await service.findDisponiveis();

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ativo: true }),
        })
      );
    });

    it('NÃO deve retornar usuários com empresaId definido', async () => {
      jest.spyOn(prisma.usuario, 'findMany').mockResolvedValue([]);

      await service.findDisponiveis();

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ empresaId: null }),
        })
      );
    });
  });

  describe('RN-005: Soft Delete (Inativação)', () => {
    it('deve marcar usuário como inativo sem deletar registro', async () => {
      const usuarioAtivo = { ...mockColaboradorEmpresaA, ativo: true };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtivo as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue({ ...usuarioAtivo, ativo: false } as any);
      jest.spyOn(prisma.usuario, 'delete');

      await service.remove('colab-a-id');

      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { ativo: false },
        })
      );
      expect(prisma.usuario.delete).not.toHaveBeenCalled();
    });

    it('deve auditar inativação', async () => {
      const usuario = { ...mockColaboradorEmpresaA, ativo: true };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuario as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue({ ...usuario, ativo: false } as any);

      await service.remove('colab-a-id');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'DELETE',
        })
      );
    });
  });

  describe('RN-006: Hard Delete com Remoção de Arquivo', () => {
    it('deve deletar arquivo de foto ao fazer hard delete', async () => {
      const usuarioComFoto = {
        ...mockColaboradorEmpresaA,
        fotoUrl: '/images/faces/foto.jpg',
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioComFoto as any);
      jest.spyOn(prisma.usuario, 'delete').mockResolvedValue({} as any);

      const deleteFileSpy = jest.spyOn<any, any>(service, 'deleteFileIfExists');

      await service.hardDelete('colab-a-id');

      expect(deleteFileSpy).toHaveBeenCalled();
      expect(prisma.usuario.delete).toHaveBeenCalled();
    });

    it('deve fazer hard delete mesmo sem foto', async () => {
      const usuarioSemFoto = { ...mockColaboradorEmpresaA, fotoUrl: null };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioSemFoto as any);
      jest.spyOn(prisma.usuario, 'delete').mockResolvedValue({} as any);

      await service.hardDelete('colab-a-id');

      expect(prisma.usuario.delete).toHaveBeenCalled();
    });

    it('deve auditar hard delete', async () => {
      const usuario = { ...mockColaboradorEmpresaA, fotoUrl: null };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuario as any);
      jest.spyOn(prisma.usuario, 'delete').mockResolvedValue({} as any);

      await service.hardDelete('colab-a-id');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'DELETE',
        })
      );
    });
  });

  describe('RN-007: Substituição de Foto de Perfil', () => {
    it('deve deletar foto antiga ao fazer upload de nova', async () => {
      const usuarioComFotoAntiga = {
        ...mockColaboradorEmpresaA,
        fotoUrl: '/images/faces/foto-antiga.jpg',
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioComFotoAntiga as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue({ ...usuarioComFotoAntiga, fotoUrl: '/images/faces/foto-nova.jpg' } as any);

      const deleteFileSpy = jest.spyOn<any, any>(service, 'deleteFileIfExists');

      await service.updateProfilePhoto('colab-a-id', '/images/faces/foto-nova.jpg', mockColaboradorEmpresaA);

      expect(deleteFileSpy).toHaveBeenCalled();
    });

    it('NÃO deve tentar deletar se usuário não tinha foto', async () => {
      const usuarioSemFoto = {
        ...mockColaboradorEmpresaA,
        fotoUrl: null,
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioSemFoto as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue({ ...usuarioSemFoto, fotoUrl: '/images/faces/foto-nova.jpg' } as any);

      const deleteFileSpy = jest.spyOn<any, any>(service, 'deleteFileIfExists');

      await service.updateProfilePhoto('colab-a-id', '/images/faces/foto-nova.jpg', mockColaboradorEmpresaA);

      expect(deleteFileSpy).not.toHaveBeenCalled();
    });
  });

  describe('RN-008: Exclusão de Foto de Perfil', () => {
    it('deve deletar arquivo físico e definir fotoUrl como null', async () => {
      const usuarioComFoto = {
        ...mockColaboradorEmpresaA,
        fotoUrl: '/images/faces/foto.jpg',
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioComFoto as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue({ ...usuarioComFoto, fotoUrl: null } as any);

      const deleteFileSpy = jest.spyOn<any, any>(service, 'deleteFileIfExists');

      const result = await service.deleteProfilePhoto('colab-a-id', mockColaboradorEmpresaA);

      expect(deleteFileSpy).toHaveBeenCalled();
      expect(result.fotoUrl).toBeNull();
    });

    it('NÃO deve falhar se usuário não tinha foto', async () => {
      const usuarioSemFoto = {
        ...mockColaboradorEmpresaA,
        fotoUrl: null,
      };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioSemFoto as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue(usuarioSemFoto as any);

      const result = await service.deleteProfilePhoto('colab-a-id', mockColaboradorEmpresaA);

      expect(result.fotoUrl).toBeNull();
    });
  });

  // ============================================================
  // CORREÇÕES DE SEGURANÇA (RA-001 a RA-004)
  // ============================================================

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
    });

    it('deve permitir GESTOR acessar usuário da mesma empresa', async () => {
      const usuarioMesmaEmpresa = { ...mockUsuarioEmpresaB, empresaId: 'empresa-a' };
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
    });
  });

  describe('RA-002: Bloqueio de Auto-Edição Privilegiada', () => {
    it('deve bloquear usuário de alterar próprio perfilId', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);

      await expect(
        service.update('colab-a-id', { perfilId: 'perfil-admin' }, mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve bloquear usuário de alterar próprio empresaId', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);

      await expect(
        service.update('colab-a-id', { empresaId: 'empresa-b' }, mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve bloquear usuário de alterar próprio campo ativo', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, ativo: false };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);

      await expect(
        service.update('colab-a-id', { ativo: true }, mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve permitir usuário alterar próprio nome, cargo e senha', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA };
      const usuarioAtualizado = { ...usuarioAtual, nome: 'Novo Nome', cargo: 'Senior' };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue(usuarioAtualizado as any);

      const result = await service.update(
        'colab-a-id',
        { nome: 'Novo Nome', cargo: 'Senior' },
        mockColaboradorEmpresaA
      );

      expect(result.nome).toBe('Novo Nome');
    });
  });

  describe('RA-003: Proteção de Recursos (Foto)', () => {
    it('deve permitir usuário alterar própria foto', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, fotoUrl: null };
      const usuarioAtualizado = { ...usuarioAtual, fotoUrl: '/images/faces/nova-foto.jpg' };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);
      jest.spyOn(prisma.usuario, 'update').mockResolvedValue(usuarioAtualizado as any);

      const result = await service.updateProfilePhoto(
        'colab-a-id',
        '/images/faces/nova-foto.jpg',
        mockColaboradorEmpresaA
      );

      expect(result.fotoUrl).toBe('/images/faces/nova-foto.jpg');
    });

    it('deve bloquear COLABORADOR de alterar foto de outro usuário', async () => {
      const outroUsuario = { ...mockUsuarioEmpresaB, empresaId: 'empresa-a' };
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(outroUsuario as any);

      await expect(
        service.updateProfilePhoto('user-b-id', '/images/faces/foto.jpg', mockColaboradorEmpresaA)
      ).rejects.toThrow(ForbiddenException);
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

    it('deve auditar alterações de foto', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA, fotoUrl: '/images/faces/old.jpg' };
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
    });

    it('deve bloquear GESTOR de promover COLABORADOR para ADMINISTRADOR', async () => {
      const usuarioAtual = { ...mockColaboradorEmpresaA };

      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(usuarioAtual as any);
      jest.spyOn(prisma.perfilUsuario, 'findUnique').mockResolvedValue(mockPerfilAdmin as any);

      await expect(
        service.update('colab-a-id', { perfilId: 'perfil-admin' }, mockGestorEmpresaA)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
