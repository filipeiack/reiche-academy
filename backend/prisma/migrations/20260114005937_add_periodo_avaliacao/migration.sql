/*
  Warnings:

  - A unique constraint covering the columns `[pilarEmpresaId,periodoAvaliacaoId]` on the table `pilares_evolucao` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `periodoAvaliacaoId` to the `pilares_evolucao` table without a default value. This is not possible if the table is not empty.
  - Made the column `mediaNotas` on table `pilares_evolucao` required. This step will fail if there are existing NULL values in that column.

*/

-- Passo 1: Adicionar coluna periodoAvaliacaoId como nullable temporariamente
ALTER TABLE "pilares_evolucao" ADD COLUMN "periodoAvaliacaoId" TEXT;

-- Passo 2: Atualizar mediaNotas NULL para 0 (caso existam)
UPDATE "pilares_evolucao" SET "mediaNotas" = 0 WHERE "mediaNotas" IS NULL;

-- CreateTable
CREATE TABLE "periodos_avaliacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "aberto" BOOLEAN NOT NULL DEFAULT true,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataCongelamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "periodos_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "periodos_avaliacao_empresaId_aberto_idx" ON "periodos_avaliacao"("empresaId", "aberto");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_avaliacao_empresaId_trimestre_ano_key" ON "periodos_avaliacao"("empresaId", "trimestre", "ano");

-- CreateIndex
CREATE INDEX "pilares_evolucao_periodoAvaliacaoId_idx" ON "pilares_evolucao"("periodoAvaliacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "pilares_evolucao_pilarEmpresaId_periodoAvaliacaoId_key" ON "pilares_evolucao"("pilarEmpresaId", "periodoAvaliacaoId");

-- AddForeignKey
ALTER TABLE "periodos_avaliacao" ADD CONSTRAINT "periodos_avaliacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Passo 3: Criar períodos retroativos para snapshots existentes
INSERT INTO periodos_avaliacao (
  id, 
  "empresaId", 
  trimestre, 
  ano, 
  "dataReferencia", 
  aberto, 
  "dataInicio", 
  "dataCongelamento", 
  "createdAt",
  "updatedAt"
)
SELECT DISTINCT ON (pe."empresaId", EXTRACT(QUARTER FROM pev."createdAt"), EXTRACT(YEAR FROM pev."createdAt"))
  gen_random_uuid() AS id,
  pe."empresaId",
  EXTRACT(QUARTER FROM pev."createdAt")::int AS trimestre,
  EXTRACT(YEAR FROM pev."createdAt")::int AS ano,
  (DATE_TRUNC('quarter', pev."createdAt") + INTERVAL '3 months' - INTERVAL '1 day')::date AS "dataReferencia",
  false AS aberto,
  DATE_TRUNC('quarter', pev."createdAt")::timestamptz AS "dataInicio",
  MAX(pev."createdAt") OVER (PARTITION BY pe."empresaId", EXTRACT(QUARTER FROM pev."createdAt"), EXTRACT(YEAR FROM pev."createdAt")) AS "dataCongelamento",
  MIN(pev."createdAt") OVER (PARTITION BY pe."empresaId", EXTRACT(QUARTER FROM pev."createdAt"), EXTRACT(YEAR FROM pev."createdAt")) AS "createdAt",
  MAX(pev."createdAt") OVER (PARTITION BY pe."empresaId", EXTRACT(QUARTER FROM pev."createdAt"), EXTRACT(YEAR FROM pev."createdAt")) AS "updatedAt"
FROM pilares_evolucao pev
JOIN pilares_empresa pe ON pe.id = pev."pilarEmpresaId"
WHERE pev."periodoAvaliacaoId" IS NULL;

-- Passo 4: Vincular snapshots antigos aos períodos criados
UPDATE pilares_evolucao pev
SET "periodoAvaliacaoId" = (
  SELECT pa.id
  FROM periodos_avaliacao pa
  JOIN pilares_empresa pe ON pe."empresaId" = pa."empresaId"
  WHERE pev."pilarEmpresaId" = pe.id
    AND pa.trimestre = EXTRACT(QUARTER FROM pev."createdAt")::int
    AND pa.ano = EXTRACT(YEAR FROM pev."createdAt")::int
  LIMIT 1
)
WHERE pev."periodoAvaliacaoId" IS NULL;

-- Passo 5: Tornar periodoAvaliacaoId NOT NULL e mediaNotas NOT NULL
ALTER TABLE "pilares_evolucao" ALTER COLUMN "periodoAvaliacaoId" SET NOT NULL;
ALTER TABLE "pilares_evolucao" ALTER COLUMN "mediaNotas" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "pilares_evolucao" ADD CONSTRAINT "pilares_evolucao_periodoAvaliacaoId_fkey" FOREIGN KEY ("periodoAvaliacaoId") REFERENCES "periodos_avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
