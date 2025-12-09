/*
  Warnings:

  - You are about to drop the column `backgroundUrl` on the `empresas` table. All the data in the column will be lost.
  - You are about to drop the column `corPrimaria` on the `empresas` table. All the data in the column will be lost.
  - You are about to drop the column `corSecundaria` on the `empresas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "empresas" DROP COLUMN "backgroundUrl",
DROP COLUMN "corPrimaria",
DROP COLUMN "corSecundaria";
