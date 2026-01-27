/*
  Warnings:

  - You are about to drop the column `periodoMentoriaId` on the `indicadores_mensais` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[indicadorCockpitId,ano,mes]` on the table `indicadores_mensais` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "indicadores_mensais" DROP CONSTRAINT "indicadores_mensais_periodoMentoriaId_fkey";

-- DropIndex
DROP INDEX "indicadores_mensais_periodoMentoriaId_idx";

-- AlterTable
ALTER TABLE "indicadores_mensais" DROP COLUMN "periodoMentoriaId";

-- CreateTable
CREATE TABLE "processos_fluxograma" (
    "id" TEXT NOT NULL,
    "processoPrioritarioId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "processos_fluxograma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processos_fluxograma_processoPrioritarioId_idx" ON "processos_fluxograma"("processoPrioritarioId");

-- CreateIndex
CREATE INDEX "indicadores_mensais_ano_mes_idx" ON "indicadores_mensais"("ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "indicadores_mensais_indicadorCockpitId_ano_mes_key" ON "indicadores_mensais"("indicadorCockpitId", "ano", "mes");

-- AddForeignKey
ALTER TABLE "processos_fluxograma" ADD CONSTRAINT "processos_fluxograma_processoPrioritarioId_fkey" FOREIGN KEY ("processoPrioritarioId") REFERENCES "processos_prioritarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
