/*
  Warnings:

  - You are about to drop the column `responsavelId` on the `rotinas_empresa` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "rotinas_empresa" DROP CONSTRAINT "rotinas_empresa_responsavelId_fkey";

-- AlterTable
ALTER TABLE "pilares_empresa" ADD COLUMN     "responsavelId" TEXT;

-- AlterTable
ALTER TABLE "rotinas_empresa" DROP COLUMN "responsavelId";

-- AddForeignKey
ALTER TABLE "pilares_empresa" ADD CONSTRAINT "pilares_empresa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
