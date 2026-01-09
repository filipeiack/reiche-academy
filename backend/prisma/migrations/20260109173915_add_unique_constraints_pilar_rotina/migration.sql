/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `rotinas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "rotinas_nome_key" ON "rotinas"("nome");
