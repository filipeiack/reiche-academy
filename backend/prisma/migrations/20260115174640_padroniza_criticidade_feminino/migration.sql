/*
  Warnings:

  - The values [MÉDIA] on the enum `Criticidade` will be removed. If these variants are still used in the database, this will fail.

  Migration Strategy:
  - Recriar enum completamente com valores corretos (ALTA, MEDIA, BAIXA)
  - Durante a migração, MÉDIA será automaticamente mapeada para MEDIA via USING clause
*/

-- AlterEnum: Recriar com valores corretos
ALTER TYPE "Criticidade" RENAME TO "Criticidade_old";
CREATE TYPE "Criticidade" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');

-- Migrar colunas: converter texto de enum antigo para novo
-- MÉDIA será mapeada para MEDIA automaticamente pela conversão de texto
ALTER TABLE "nota_rotinas" 
  ALTER COLUMN "criticidade" TYPE "Criticidade" 
  USING (
    CASE 
      WHEN "criticidade"::text = 'MÉDIA' THEN 'MEDIA'::text
      ELSE "criticidade"::text
    END
  )::"Criticidade";

ALTER TABLE "funcoes_cargo" 
  ALTER COLUMN "nivelCritico" TYPE "Criticidade" 
  USING (
    CASE 
      WHEN "nivelCritico"::text = 'MÉDIA' THEN 'MEDIA'::text
      ELSE "nivelCritico"::text
    END
  )::"Criticidade";

DROP TYPE "Criticidade_old";
