-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA');

-- CreateEnum
CREATE TYPE "Criticidade" AS ENUM ('ALTA', 'MÉDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "StatusAcao" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "tipoNegocio" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilares" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "modelo" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "pilares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotinas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "modelo" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pilarId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "rotinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilares_empresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "pilarId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "pilares_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotinas_empresa" (
    "id" TEXT NOT NULL,
    "pilarEmpresaId" TEXT NOT NULL,
    "rotinaId" TEXT NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "rotinas_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_rotinas" (
    "id" TEXT NOT NULL,
    "rotinaEmpresaId" TEXT NOT NULL,
    "nota" DOUBLE PRECISION,
    "criticidade" "Criticidade",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "nota_rotinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilares_evolucao" (
    "id" TEXT NOT NULL,
    "pilarEmpresaId" TEXT NOT NULL,
    "mediaNotas" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "pilares_evolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_reunioes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracao" INTEGER,
    "local" TEXT,
    "link" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "agenda_reunioes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "usuarioNome" TEXT NOT NULL,
    "usuarioEmail" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "pilares_nome_key" ON "pilares"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "pilares_empresa_empresaId_pilarId_key" ON "pilares_empresa"("empresaId", "pilarId");

-- CreateIndex
CREATE INDEX "rotinas_empresa_pilarEmpresaId_idx" ON "rotinas_empresa"("pilarEmpresaId");

-- CreateIndex
CREATE INDEX "rotinas_empresa_rotinaId_idx" ON "rotinas_empresa"("rotinaId");

-- CreateIndex
CREATE UNIQUE INDEX "rotinas_empresa_pilarEmpresaId_rotinaId_key" ON "rotinas_empresa"("pilarEmpresaId", "rotinaId");

-- CreateIndex
CREATE INDEX "nota_rotinas_rotinaEmpresaId_idx" ON "nota_rotinas"("rotinaEmpresaId");

-- CreateIndex
CREATE INDEX "agenda_reunioes_usuarioId_idx" ON "agenda_reunioes"("usuarioId");

-- CreateIndex
CREATE INDEX "audit_logs_entidade_entidadeId_idx" ON "audit_logs"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "audit_logs_usuarioId_idx" ON "audit_logs"("usuarioId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotinas" ADD CONSTRAINT "rotinas_pilarId_fkey" FOREIGN KEY ("pilarId") REFERENCES "pilares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilares_empresa" ADD CONSTRAINT "pilares_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilares_empresa" ADD CONSTRAINT "pilares_empresa_pilarId_fkey" FOREIGN KEY ("pilarId") REFERENCES "pilares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotinas_empresa" ADD CONSTRAINT "rotinas_empresa_pilarEmpresaId_fkey" FOREIGN KEY ("pilarEmpresaId") REFERENCES "pilares_empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotinas_empresa" ADD CONSTRAINT "rotinas_empresa_rotinaId_fkey" FOREIGN KEY ("rotinaId") REFERENCES "rotinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_rotinas" ADD CONSTRAINT "nota_rotinas_rotinaEmpresaId_fkey" FOREIGN KEY ("rotinaEmpresaId") REFERENCES "rotinas_empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilares_evolucao" ADD CONSTRAINT "pilares_evolucao_pilarEmpresaId_fkey" FOREIGN KEY ("pilarEmpresaId") REFERENCES "pilares_empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_reunioes" ADD CONSTRAINT "agenda_reunioes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
