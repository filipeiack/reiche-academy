-- CreateTable
CREATE TABLE "objetivos_templates" (
    "id" TEXT NOT NULL,
    "pilarId" TEXT NOT NULL,
    "entradas" TEXT NOT NULL,
    "saidas" TEXT NOT NULL,
    "missao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "objetivos_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "objetivos_templates_pilarId_key" ON "objetivos_templates"("pilarId");

-- AddForeignKey
ALTER TABLE "objetivos_templates" ADD CONSTRAINT "objetivos_templates_pilarId_fkey" FOREIGN KEY ("pilarId") REFERENCES "pilares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
