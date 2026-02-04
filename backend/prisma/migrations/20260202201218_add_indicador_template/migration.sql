-- CreateTable
CREATE TABLE "indicadores_templates" (
    "id" TEXT NOT NULL,
    "pilarId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoMedida" "TipoMedidaIndicador" NOT NULL,
    "statusMedicao" "StatusMedicaoIndicador" NOT NULL,
    "melhor" "DirecaoIndicador" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "indicadores_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "indicadores_templates_pilarId_idx" ON "indicadores_templates"("pilarId");

-- CreateIndex
CREATE UNIQUE INDEX "indicadores_templates_pilarId_nome_key" ON "indicadores_templates"("pilarId", "nome");

-- AddForeignKey
ALTER TABLE "indicadores_templates" ADD CONSTRAINT "indicadores_templates_pilarId_fkey" FOREIGN KEY ("pilarId") REFERENCES "pilares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
