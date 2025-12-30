-- AlterTable
ALTER TABLE "rotinas_empresa" ADD COLUMN     "responsavelId" TEXT;

-- AddForeignKey
ALTER TABLE "rotinas_empresa" ADD CONSTRAINT "rotinas_empresa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
