-- CreateEnum
CREATE TYPE "TipoMedidaIndicador" AS ENUM ('REAL', 'QUANTIDADE', 'TEMPO', 'PERCENTUAL');

-- CreateEnum
CREATE TYPE "StatusMedicaoIndicador" AS ENUM ('NAO_MEDIDO', 'MEDIDO_NAO_CONFIAVEL', 'MEDIDO_CONFIAVEL');

-- CreateEnum
CREATE TYPE "DirecaoIndicador" AS ENUM ('MAIOR', 'MENOR');

-- CreateEnum
CREATE TYPE "StatusProcesso" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "cockpits_pilares" (
    "id" TEXT NOT NULL,
    "pilarEmpresaId" TEXT NOT NULL,
    "entradas" TEXT,
    "saidas" TEXT,
    "missao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "cockpits_pilares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicadores_cockpit" (
    "id" TEXT NOT NULL,
    "cockpitPilarId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoMedida" "TipoMedidaIndicador" NOT NULL,
    "statusMedicao" "StatusMedicaoIndicador" NOT NULL,
    "melhor" "DirecaoIndicador" NOT NULL,
    "responsavelMedicaoId" TEXT,
    "ordem" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "indicadores_cockpit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicadores_mensais" (
    "id" TEXT NOT NULL,
    "indicadorCockpitId" TEXT NOT NULL,
    "mes" INTEGER,
    "ano" INTEGER NOT NULL,
    "meta" DOUBLE PRECISION,
    "realizado" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "indicadores_mensais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos_prioritarios" (
    "id" TEXT NOT NULL,
    "cockpitPilarId" TEXT NOT NULL,
    "rotinaEmpresaId" TEXT NOT NULL,
    "statusMapeamento" "StatusProcesso" NOT NULL DEFAULT 'PENDENTE',
    "statusTreinamento" "StatusProcesso" NOT NULL DEFAULT 'PENDENTE',
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "processos_prioritarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos_cockpit" (
    "id" TEXT NOT NULL,
    "cockpitPilarId" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "usuarioId" TEXT,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "cargos_cockpit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcoes_cargo" (
    "id" TEXT NOT NULL,
    "cargoCockpitId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "nivelCritico" "Criticidade" NOT NULL,
    "autoAvaliacao" DOUBLE PRECISION,
    "avaliacaoLideranca" DOUBLE PRECISION,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "funcoes_cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acoes_cockpit" (
    "id" TEXT NOT NULL,
    "cockpitPilarId" TEXT NOT NULL,
    "indicadorCockpitId" TEXT,
    "analiseMes" TEXT,
    "causa1" TEXT,
    "causa2" TEXT,
    "causa3" TEXT,
    "causa4" TEXT,
    "causa5" TEXT,
    "acaoProposta" TEXT NOT NULL,
    "responsavelId" TEXT,
    "status" "StatusAcao" NOT NULL DEFAULT 'PENDENTE',
    "prazo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "acoes_cockpit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cockpits_pilares_pilarEmpresaId_key" ON "cockpits_pilares"("pilarEmpresaId");

-- CreateIndex
CREATE INDEX "indicadores_cockpit_cockpitPilarId_idx" ON "indicadores_cockpit"("cockpitPilarId");

-- CreateIndex
CREATE INDEX "indicadores_cockpit_responsavelMedicaoId_idx" ON "indicadores_cockpit"("responsavelMedicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "indicadores_cockpit_cockpitPilarId_nome_key" ON "indicadores_cockpit"("cockpitPilarId", "nome");

-- CreateIndex
CREATE INDEX "indicadores_mensais_indicadorCockpitId_idx" ON "indicadores_mensais"("indicadorCockpitId");

-- CreateIndex
CREATE UNIQUE INDEX "indicadores_mensais_indicadorCockpitId_ano_mes_key" ON "indicadores_mensais"("indicadorCockpitId", "ano", "mes");

-- CreateIndex
CREATE INDEX "processos_prioritarios_cockpitPilarId_idx" ON "processos_prioritarios"("cockpitPilarId");

-- CreateIndex
CREATE INDEX "processos_prioritarios_rotinaEmpresaId_idx" ON "processos_prioritarios"("rotinaEmpresaId");

-- CreateIndex
CREATE UNIQUE INDEX "processos_prioritarios_cockpitPilarId_rotinaEmpresaId_key" ON "processos_prioritarios"("cockpitPilarId", "rotinaEmpresaId");

-- CreateIndex
CREATE INDEX "cargos_cockpit_cockpitPilarId_idx" ON "cargos_cockpit"("cockpitPilarId");

-- CreateIndex
CREATE INDEX "cargos_cockpit_usuarioId_idx" ON "cargos_cockpit"("usuarioId");

-- CreateIndex
CREATE INDEX "funcoes_cargo_cargoCockpitId_idx" ON "funcoes_cargo"("cargoCockpitId");

-- CreateIndex
CREATE INDEX "acoes_cockpit_cockpitPilarId_idx" ON "acoes_cockpit"("cockpitPilarId");

-- CreateIndex
CREATE INDEX "acoes_cockpit_indicadorCockpitId_idx" ON "acoes_cockpit"("indicadorCockpitId");

-- CreateIndex
CREATE INDEX "acoes_cockpit_responsavelId_idx" ON "acoes_cockpit"("responsavelId");

-- AddForeignKey
ALTER TABLE "cockpits_pilares" ADD CONSTRAINT "cockpits_pilares_pilarEmpresaId_fkey" FOREIGN KEY ("pilarEmpresaId") REFERENCES "pilares_empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores_cockpit" ADD CONSTRAINT "indicadores_cockpit_cockpitPilarId_fkey" FOREIGN KEY ("cockpitPilarId") REFERENCES "cockpits_pilares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores_cockpit" ADD CONSTRAINT "indicadores_cockpit_responsavelMedicaoId_fkey" FOREIGN KEY ("responsavelMedicaoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores_mensais" ADD CONSTRAINT "indicadores_mensais_indicadorCockpitId_fkey" FOREIGN KEY ("indicadorCockpitId") REFERENCES "indicadores_cockpit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_prioritarios" ADD CONSTRAINT "processos_prioritarios_cockpitPilarId_fkey" FOREIGN KEY ("cockpitPilarId") REFERENCES "cockpits_pilares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_prioritarios" ADD CONSTRAINT "processos_prioritarios_rotinaEmpresaId_fkey" FOREIGN KEY ("rotinaEmpresaId") REFERENCES "rotinas_empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos_cockpit" ADD CONSTRAINT "cargos_cockpit_cockpitPilarId_fkey" FOREIGN KEY ("cockpitPilarId") REFERENCES "cockpits_pilares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos_cockpit" ADD CONSTRAINT "cargos_cockpit_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcoes_cargo" ADD CONSTRAINT "funcoes_cargo_cargoCockpitId_fkey" FOREIGN KEY ("cargoCockpitId") REFERENCES "cargos_cockpit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acoes_cockpit" ADD CONSTRAINT "acoes_cockpit_cockpitPilarId_fkey" FOREIGN KEY ("cockpitPilarId") REFERENCES "cockpits_pilares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acoes_cockpit" ADD CONSTRAINT "acoes_cockpit_indicadorCockpitId_fkey" FOREIGN KEY ("indicadorCockpitId") REFERENCES "indicadores_cockpit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acoes_cockpit" ADD CONSTRAINT "acoes_cockpit_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
