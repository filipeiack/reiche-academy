/*
  Warnings:

  - You are about to drop the column `analiseMes` on the `acoes_cockpit` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `cargos_cockpit` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "cargos_cockpit" DROP CONSTRAINT "cargos_cockpit_usuarioId_fkey";

-- DropIndex
DROP INDEX "cargos_cockpit_usuarioId_idx";

-- AlterTable
ALTER TABLE "acoes_cockpit" DROP COLUMN "analiseMes",
ADD COLUMN     "indicadorMensalId" TEXT;

-- AlterTable
ALTER TABLE "cargos_cockpit" DROP COLUMN "usuarioId";

-- CreateTable
CREATE TABLE "cargos_cockpit_responsaveis" (
    "id" TEXT NOT NULL,
    "cargoCockpitId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargos_cockpit_responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cargos_cockpit_responsaveis_cargoCockpitId_idx" ON "cargos_cockpit_responsaveis"("cargoCockpitId");

-- CreateIndex
CREATE INDEX "cargos_cockpit_responsaveis_usuarioId_idx" ON "cargos_cockpit_responsaveis"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_cockpit_responsaveis_cargoCockpitId_usuarioId_key" ON "cargos_cockpit_responsaveis"("cargoCockpitId", "usuarioId");

-- CreateIndex
CREATE INDEX "acoes_cockpit_indicadorMensalId_idx" ON "acoes_cockpit"("indicadorMensalId");

-- AddForeignKey
ALTER TABLE "cargos_cockpit_responsaveis" ADD CONSTRAINT "cargos_cockpit_responsaveis_cargoCockpitId_fkey" FOREIGN KEY ("cargoCockpitId") REFERENCES "cargos_cockpit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos_cockpit_responsaveis" ADD CONSTRAINT "cargos_cockpit_responsaveis_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acoes_cockpit" ADD CONSTRAINT "acoes_cockpit_indicadorMensalId_fkey" FOREIGN KEY ("indicadorMensalId") REFERENCES "indicadores_mensais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
