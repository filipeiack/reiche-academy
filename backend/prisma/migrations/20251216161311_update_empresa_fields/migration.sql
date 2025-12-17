/*
  Warnings:

  - You are about to drop the column `razaoSocial` on the `empresas` table. All the data in the column will be lost.
  - Added the required column `cidade` to the `empresas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `empresas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoBrasil" AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

-- AlterTable
ALTER TABLE "empresas" DROP COLUMN "razaoSocial",
ADD COLUMN     "cidade" TEXT NOT NULL DEFAULT 'São Paulo',
ADD COLUMN     "estado" "EstadoBrasil" NOT NULL DEFAULT 'SP',
ALTER COLUMN "tipoNegocio" DROP NOT NULL;
