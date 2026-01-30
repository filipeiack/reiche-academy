-- DropIndex
DROP INDEX "indicadores_mensais_indicadorCockpitId_ano_mes_key";

-- AlterTable
ALTER TABLE "indicadores_mensais" ADD COLUMN     "periodoMentoriaId" TEXT;

-- AlterTable
ALTER TABLE "periodos_avaliacao" ADD COLUMN     "periodoMentoriaId" TEXT;

-- CreateTable
CREATE TABLE "periodos_mentoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataContratacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataEncerramento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "periodos_mentoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "periodos_mentoria_empresaId_ativo_idx" ON "periodos_mentoria"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_mentoria_empresaId_numero_key" ON "periodos_mentoria"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "indicadores_mensais_periodoMentoriaId_idx" ON "indicadores_mensais"("periodoMentoriaId");

-- AddForeignKey
ALTER TABLE "periodos_avaliacao" ADD CONSTRAINT "periodos_avaliacao_periodoMentoriaId_fkey" FOREIGN KEY ("periodoMentoriaId") REFERENCES "periodos_mentoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores_mensais" ADD CONSTRAINT "indicadores_mensais_periodoMentoriaId_fkey" FOREIGN KEY ("periodoMentoriaId") REFERENCES "periodos_mentoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodos_mentoria" ADD CONSTRAINT "periodos_mentoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
