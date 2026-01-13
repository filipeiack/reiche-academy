/*
  Warnings:

  - You are about to alter the column `nome` on the `pilares` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(60)`.
  - You are about to alter the column `nome` on the `pilares_empresa` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(60)`.

*/
-- AlterTable
ALTER TABLE "pilares" ALTER COLUMN "nome" SET DATA TYPE VARCHAR(60);

-- AlterTable
ALTER TABLE "pilares_empresa" ALTER COLUMN "nome" SET DATA TYPE VARCHAR(60);
