import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * TokenCleanupService
 * 
 * Responsável por limpar tokens expirados e inativos do banco de dados.
 * 
 * Implementa RN-SEC-001.6:
 * - Remove tokens expirados (expiresAt < now)
 * - Remove tokens inativos há mais de 90 dias
 * 
 * Executa diariamente às 3:00 AM (horário do servidor)
 */
@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron job executado diariamente às 3:00 AM
   * Remove tokens expirados e inativos antigos
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    const startTime = Date.now();
    this.logger.log('Iniciando limpeza de tokens expirados/inativos...');

    try {
      const now = new Date();
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Deletar tokens expirados
      const expiredResult = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      // Deletar tokens inativos há mais de 90 dias
      const inactiveResult = await this.prisma.refreshToken.deleteMany({
        where: {
          isActive: false,
          updatedAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      const totalDeleted = expiredResult.count + inactiveResult.count;
      const duration = Date.now() - startTime;

      this.logger.log(
        `Limpeza concluída: ${expiredResult.count} tokens expirados, ` +
        `${inactiveResult.count} tokens inativos removidos. ` +
        `Total: ${totalDeleted} tokens em ${duration}ms`,
      );
    } catch (error) {
      this.logger.error('Erro ao limpar tokens:', error);
      // Não lança exceção para não quebrar aplicação
    }
  }

  /**
   * Método manual para forçar limpeza (útil para testes/manutenção)
   */
  async forceCleanup(): Promise<{ deleted: number }> {
    this.logger.log('Limpeza manual iniciada...');
    await this.cleanupExpiredTokens();
    return { deleted: 0 }; // Valor retornado no log acima
  }
}
