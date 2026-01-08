/*
  Warnings:

  - You are about to drop the column `modelo` on the `pilares` table. All the data in the column will be lost.
  - You are about to drop the column `pilarId` on the `pilares_empresa` table. All the data in the column will be lost.
  - You are about to drop the column `modelo` on the `rotinas` table. All the data in the column will be lost.
  - You are about to drop the column `rotinaId` on the `rotinas_empresa` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[empresaId,nome]` on the table `pilares_empresa` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pilarEmpresaId,nome]` on the table `rotinas_empresa` will be added. If there are existing duplicate values, this will fail.
  - Made the column `ordem` on table `pilares` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `nome` to the `pilares_empresa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `rotinas_empresa` table without a default value. This is not possible if the table is not empty.

*/

-- ==========================================
-- ETAPA 1: Preparação do Schema
-- ==========================================

-- 1.1 Adicionar novos campos a PilarEmpresa
ALTER TABLE "pilares_empresa" 
  ADD COLUMN "pilarTemplateId" TEXT,
  ADD COLUMN "nome" TEXT,
  ADD COLUMN "descricao" TEXT;

-- 1.2 Adicionar novos campos a RotinaEmpresa
ALTER TABLE "rotinas_empresa" 
  ADD COLUMN "rotinaTemplateId" TEXT,
  ADD COLUMN "nome" TEXT,
  ADD COLUMN "descricao" TEXT;

-- 1.3 Tornar pilarId e rotinaId nullable temporariamente
ALTER TABLE "pilares_empresa" 
  ALTER COLUMN "pilarId" DROP NOT NULL;

ALTER TABLE "rotinas_empresa" 
  ALTER COLUMN "rotinaId" DROP NOT NULL;

-- ==========================================
-- ETAPA 2: Migração de Dados
-- ==========================================

-- 2.1 Copiar dados de Pilar para PilarEmpresa (todos registros existentes)
UPDATE "pilares_empresa" pe
SET 
  "pilarTemplateId" = pe."pilarId",
  "nome" = p.nome,
  "descricao" = p.descricao
FROM "pilares" p
WHERE pe."pilarId" = p.id;

-- 2.2 Copiar dados de Rotina para RotinaEmpresa (todos registros existentes)
UPDATE "rotinas_empresa" re
SET 
  "rotinaTemplateId" = re."rotinaId",
  "nome" = r.nome,
  "descricao" = r.descricao
FROM "rotinas" r
WHERE re."rotinaId" = r.id;

-- 2.3 Remover registros modelo=false de Pilar (já copiados para PilarEmpresa)
-- NOTA: Não há pilares com modelo=false vinculados a PilarEmpresa no design atual
-- Esta step está aqui por consistência com a documentação

-- 2.4 Remover registros modelo=false de Rotina (já copiados para RotinaEmpresa)
-- NOTA: Não há rotinas com modelo=false vinculadas a RotinaEmpresa no design atual
-- Esta step está aqui por consistência com a documentação

-- ==========================================
-- ETAPA 3: Atualizar Constraints
-- ==========================================

-- 3.1 Remover constraint antiga de PilarEmpresa
ALTER TABLE "pilares_empresa"
  DROP CONSTRAINT IF EXISTS "pilares_empresa_empresaId_pilarId_key";

-- 3.2 Remover constraint antiga de RotinaEmpresa
ALTER TABLE "rotinas_empresa"
  DROP CONSTRAINT IF EXISTS "rotinas_empresa_pilarEmpresaId_rotinaId_key";

-- 3.3 Drop foreign keys antigas
ALTER TABLE "pilares_empresa" DROP CONSTRAINT IF EXISTS "pilares_empresa_pilarId_fkey";
ALTER TABLE "rotinas_empresa" DROP CONSTRAINT IF EXISTS "rotinas_empresa_rotinaId_fkey";

-- 3.4 Drop índices antigos
DROP INDEX IF EXISTS "pilares_ordem_key";
DROP INDEX IF EXISTS "rotinas_empresa_rotinaId_idx";

-- 3.5 Remover colunas antigas
ALTER TABLE "pilares_empresa" DROP COLUMN "pilarId";
ALTER TABLE "rotinas_empresa" DROP COLUMN "rotinaId";

-- 3.6 Remover campo modelo
ALTER TABLE "pilares" DROP COLUMN "modelo";
ALTER TABLE "rotinas" DROP COLUMN "modelo";

-- 3.7 Tornar nome obrigatório
ALTER TABLE "pilares_empresa" 
  ALTER COLUMN "nome" SET NOT NULL;

ALTER TABLE "rotinas_empresa" 
  ALTER COLUMN "nome" SET NOT NULL;

-- 3.8 Adicionar constraints de nome único
CREATE UNIQUE INDEX "pilares_empresa_empresaId_nome_key" 
  ON "pilares_empresa"("empresaId", "nome");

CREATE UNIQUE INDEX "rotinas_empresa_pilarEmpresaId_nome_key" 
  ON "rotinas_empresa"("pilarEmpresaId", "nome");

-- 3.9 Adicionar FK para templates (nullable)
ALTER TABLE "pilares_empresa"
  ADD CONSTRAINT "pilares_empresa_pilarTemplateId_fkey"
  FOREIGN KEY ("pilarTemplateId")
  REFERENCES "pilares"(id)
  ON DELETE SET NULL;

ALTER TABLE "rotinas_empresa"
  ADD CONSTRAINT "rotinas_empresa_rotinaTemplateId_fkey"
  FOREIGN KEY ("rotinaTemplateId")
  REFERENCES "rotinas"(id)
  ON DELETE SET NULL;

-- 3.10 Adicionar índice para performance
CREATE INDEX "rotinas_empresa_rotinaTemplateId_idx" 
  ON "rotinas_empresa"("rotinaTemplateId");

-- ==========================================
-- ETAPA 4: Finalização - Ordem Obrigatória
-- ==========================================

-- 4.1 Preencher valores NULL de ordem em Pilar (auto-increment)
UPDATE "pilares" 
SET "ordem" = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) as row_num
  FROM "pilares"
  WHERE "ordem" IS NULL
) as subquery
WHERE "pilares".id = subquery.id;

-- 4.2 Tornar ordem obrigatório em Pilar
ALTER TABLE "pilares" 
  ALTER COLUMN "ordem" SET NOT NULL;
