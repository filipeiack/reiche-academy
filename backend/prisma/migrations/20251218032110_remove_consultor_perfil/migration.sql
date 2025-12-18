-- AlterTable
-- Atualizar descrições dos perfis existentes
UPDATE "perfis_usuario" 
SET descricao = 'Equipe Reiche Academy - Acesso total ao sistema', nivel = 1
WHERE codigo = 'ADMINISTRADOR';

UPDATE "perfis_usuario" 
SET descricao = 'Empresa cliente - Gerencia diagnósticos e dados da empresa', nivel = 2
WHERE codigo = 'GESTOR';

UPDATE "perfis_usuario" 
SET descricao = 'Empresa cliente - Acessa diagnósticos e dados da empresa', nivel = 3
WHERE codigo = 'COLABORADOR';

UPDATE "perfis_usuario" 
SET descricao = 'Empresa cliente - Apenas visualização', nivel = 4
WHERE codigo = 'LEITURA';

-- Migrar usuários com perfil CONSULTOR para ADMINISTRADOR
UPDATE "usuarios" u
SET "perfilId" = (SELECT id FROM "perfis_usuario" WHERE codigo = 'ADMINISTRADOR')
WHERE "perfilId" IN (SELECT id FROM "perfis_usuario" WHERE codigo = 'CONSULTOR');

-- Deletar o perfil CONSULTOR
DELETE FROM "perfis_usuario" WHERE codigo = 'CONSULTOR';

