-- DropIndex
DROP INDEX "pilares_nome_key";

-- DropIndex
DROP INDEX "rotinas_nome_key";

-- CreateIndex: Case-insensitive unique constraint for pilares.nome
CREATE UNIQUE INDEX "pilares_nome_key" ON "pilares"(LOWER("nome"));

-- CreateIndex: Case-insensitive unique constraint for rotinas.nome
CREATE UNIQUE INDEX "rotinas_nome_key" ON "rotinas"(LOWER("nome"));
