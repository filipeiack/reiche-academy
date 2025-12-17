-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "email" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "motivoFalha" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "dispositivo" TEXT,
    "navegador" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_history_usuarioId_idx" ON "login_history"("usuarioId");

-- CreateIndex
CREATE INDEX "login_history_email_idx" ON "login_history"("email");

-- CreateIndex
CREATE INDEX "login_history_createdAt_idx" ON "login_history"("createdAt");

-- CreateIndex
CREATE INDEX "login_history_sucesso_idx" ON "login_history"("sucesso");

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
