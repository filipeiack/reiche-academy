-- AlterTable
ALTER TABLE "processos_prioritarios" ALTER COLUMN "statusMapeamento" DROP NOT NULL,
ALTER COLUMN "statusMapeamento" DROP DEFAULT,
ALTER COLUMN "statusTreinamento" DROP NOT NULL,
ALTER COLUMN "statusTreinamento" DROP DEFAULT;
