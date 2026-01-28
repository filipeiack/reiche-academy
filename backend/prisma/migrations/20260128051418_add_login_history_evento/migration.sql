-- CreateEnum
CREATE TYPE "LoginHistoryEvento" AS ENUM ('LOGIN', 'LOGOUT', 'LOGOUT_ALL', 'RESET_SENHA');

-- AlterTable
ALTER TABLE "login_history" ADD COLUMN     "evento" "LoginHistoryEvento" NOT NULL DEFAULT 'LOGIN';
