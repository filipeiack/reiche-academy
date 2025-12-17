import { Injectable, Logger } from '@nestjs/common';

export interface SendPasswordResetEmailParams {
  to: string;
  nome: string;
  resetLink: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Envia email de recuperação de senha
   * TODO: Integrar com serviço real de email (SendGrid, AWS SES, Nodemailer, etc)
   */
  async sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<void> {
    const { to, nome, resetLink } = params;

    // Por enquanto apenas loga (em produção, integrar com provedor de email)
    this.logger.log(`
=================================================================
📧 EMAIL DE RECUPERAÇÃO DE SENHA
=================================================================
Para: ${to}
Nome: ${nome}
Link: ${resetLink}
Expira em: 15 minutos
=================================================================
    `);

    // Exemplo de integração futura:
    // await this.mailerService.sendMail({
    //   to,
    //   subject: 'Recuperação de Senha - Reiche Academy',
    //   template: 'password-reset',
    //   context: { nome, resetLink },
    // });

    return Promise.resolve();
  }

  /**
   * Envia email de confirmação de troca de senha
   */
  async sendPasswordChangedEmail(to: string, nome: string): Promise<void> {
    this.logger.log(`
=================================================================
📧 EMAIL DE CONFIRMAÇÃO DE TROCA DE SENHA
=================================================================
Para: ${to}
Nome: ${nome}
Mensagem: Sua senha foi alterada com sucesso!
=================================================================
    `);

    return Promise.resolve();
  }
}
