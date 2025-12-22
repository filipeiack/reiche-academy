/*
  Warnings:

  - Added the required column `ordem` to the `pilares_empresa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ordem` to the `rotinas_empresa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pilares" ALTER COLUMN "ordem" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pilares_empresa" ADD COLUMN     "ordem" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "rotinas" ALTER COLUMN "ordem" DROP NOT NULL;

-- AlterTable
ALTER TABLE "rotinas_empresa" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ordem" INTEGER NOT NULL;
