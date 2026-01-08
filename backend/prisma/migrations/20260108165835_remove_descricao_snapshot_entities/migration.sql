/*
  Warnings:

  - You are about to drop the column `descricao` on the `pilares_empresa` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `rotinas_empresa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pilares_empresa" DROP COLUMN "descricao";

-- AlterTable
ALTER TABLE "rotinas_empresa" DROP COLUMN "descricao";
