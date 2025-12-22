/*
  Warnings:

  - A unique constraint covering the columns `[ordem]` on the table `pilares` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pilares_ordem_key" ON "pilares"("ordem");
