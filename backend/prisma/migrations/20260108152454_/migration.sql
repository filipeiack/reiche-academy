-- DropForeignKey
ALTER TABLE "pilares_empresa" DROP CONSTRAINT "pilares_empresa_pilarTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "rotinas_empresa" DROP CONSTRAINT "rotinas_empresa_rotinaTemplateId_fkey";

-- AddForeignKey
ALTER TABLE "pilares_empresa" ADD CONSTRAINT "pilares_empresa_pilarTemplateId_fkey" FOREIGN KEY ("pilarTemplateId") REFERENCES "pilares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotinas_empresa" ADD CONSTRAINT "rotinas_empresa_rotinaTemplateId_fkey" FOREIGN KEY ("rotinaTemplateId") REFERENCES "rotinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
