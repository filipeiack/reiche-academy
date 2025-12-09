-- Add loginUrl and logoUrl columns to empresas table
ALTER TABLE "empresas" 
ADD COLUMN IF NOT EXISTS "loginUrl" TEXT,
ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
