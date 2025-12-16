/*
  Warnings:

  - You are about to drop the column `perfil` on the `usuarios` table. All the data in the column will be lost.
  - Added the required column `perfilId` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE "perfis_usuario" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "nivel" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfis_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfis_usuario_codigo_key" ON "perfis_usuario"("codigo");

-- Inserir perfis padrão
INSERT INTO "perfis_usuario" ("id", "codigo", "nome", "descricao", "nivel", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'ADMINISTRADOR', 'Administrador', 'Acesso total ao sistema', 1, NOW(), NOW()),
  (gen_random_uuid(), 'CONSULTOR', 'Consultor', 'Gerencia estrutura (pilares, rotinas, empresas)', 2, NOW(), NOW()),
  (gen_random_uuid(), 'GESTOR', 'Gestor', 'Gerencia empresa e colaboradores', 3, NOW(), NOW()),
  (gen_random_uuid(), 'COLABORADOR', 'Colaborador', 'Acessa dados da empresa', 4, NOW(), NOW()),
  (gen_random_uuid(), 'LEITURA', 'Leitura', 'Apenas visualização', 5, NOW(), NOW());

-- Adicionar coluna temporária para mapear perfis antigos
ALTER TABLE "usuarios" ADD COLUMN "perfilId" TEXT;

-- Mapear perfis antigos para novos IDs
UPDATE "usuarios" u
SET "perfilId" = p.id
FROM "perfis_usuario" p
WHERE u.perfil::text = p.codigo;

-- Tornar perfilId obrigatório
ALTER TABLE "usuarios" ALTER COLUMN "perfilId" SET NOT NULL;

-- Remover coluna antiga
ALTER TABLE "usuarios" DROP COLUMN "perfil";

-- DropEnum
DROP TYPE "PerfilUsuario";

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis_usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
