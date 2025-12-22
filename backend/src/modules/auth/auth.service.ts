import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from './email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, senha: string, ip?: string, userAgent?: string): Promise<any> {
    const usuario = await this.usuariosService.findByEmail(email);
    
    if (!usuario || !usuario.ativo) {
      // Registra tentativa de login falhada
      await this.registrarLogin(null, email, false, 'Credenciais inválidas', ip, userAgent);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await argon2.verify(usuario.senha, senha);
    
    if (!isPasswordValid) {
      // Registra tentativa de login falhada
      await this.registrarLogin(usuario.id, email, false, 'Senha incorreta', ip, userAgent);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const { senha: _, ...result } = usuario;
    return result;
  }

  async login(usuario: any, ip?: string, userAgent?: string) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil?.codigo || usuario.perfil,
      empresaId: usuario.empresaId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

    // Registra login bem-sucedido
    await this.registrarLogin(usuario.id, usuario.email, true, null, ip, userAgent);

    return {
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        cargo: usuario.cargo,
        perfil: usuario.perfil,
        empresaId: usuario.empresaId,
        empresa: usuario.empresa,
        fotoUrl: usuario.fotoUrl,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const usuario = await this.usuariosService.findByIdInternal(payload.sub);
      
      if (!usuario || !usuario.ativo) {
        throw new UnauthorizedException('Token inválido');
      }

      return this.login(usuario);
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async hashPassword(senha: string): Promise<string> {
    return argon2.hash(senha);
  }

  /**
   * Solicita reset de senha - envia email com token
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    // Retorna sucesso mesmo se email não existir (segurança)
    if (!usuario) {
      return { message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
    }

    if (!usuario.ativo) {
      throw new BadRequestException('Usuário inativo');
    }

    // Gera token único
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos

    // Salva token no banco
    await this.prisma.passwordReset.create({
      data: {
        token,
        expiresAt,
        usuarioId: usuario.id,
      },
    });

    // Monta link de reset (ajustar URL conforme ambiente)
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

    // Envia email
    await this.emailService.sendPasswordResetEmail({
      to: usuario.email,
      nome: usuario.nome,
      resetLink,
    });

    return { message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
  }

  /**
   * Reseta a senha usando o token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Busca token
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
      include: { usuario: true },
    });

    if (!passwordReset) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    // Verifica se já foi usado
    if (passwordReset.used) {
      throw new BadRequestException('Este link já foi utilizado');
    }

    // Verifica expiração
    if (new Date() > passwordReset.expiresAt) {
      throw new BadRequestException('Token expirado. Solicite um novo link de recuperação.');
    }

    // Hash da nova senha
    const senhaHash = await this.hashPassword(dto.novaSenha);

    // Atualiza senha do usuário
    await this.prisma.usuario.update({
      where: { id: passwordReset.usuarioId },
      data: { senha: senhaHash },
    });

    // Marca token como usado
    await this.prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { used: true },
    });

    // Envia email de confirmação
    await this.emailService.sendPasswordChangedEmail(
      passwordReset.usuario.email,
      passwordReset.usuario.nome,
    );

    return { message: 'Senha alterada com sucesso!' };
  }

  /**
   * Registra tentativa de login (sucesso ou falha) para auditoria
   */
  private async registrarLogin(
    usuarioId: string | null,
    email: string,
    sucesso: boolean,
    motivoFalha: string | null,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      let dispositivo: string | null = null;
      let navegador: string | null = null;

      // Parse básico do user agent
      if (userAgent) {
        const ua = userAgent.toLowerCase();
        
        // Detecta dispositivo
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          dispositivo = 'Mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          dispositivo = 'Tablet';
        } else {
          dispositivo = 'Desktop';
        }

        // Detecta navegador
        if (ua.includes('edg/') || ua.includes('edge/')) {
          navegador = 'Edge';
        } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
          navegador = 'Chrome';
        } else if (ua.includes('firefox/')) {
          navegador = 'Firefox';
        } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
          navegador = 'Safari';
        } else if (ua.includes('opera/') || ua.includes('opr/')) {
          navegador = 'Opera';
        } else {
          navegador = 'Outro';
        }
      }

      await this.prisma.loginHistory.create({
        data: {
          usuarioId,
          email,
          sucesso,
          motivoFalha,
          ipAddress: ip,
          userAgent,
          dispositivo,
          navegador,
        },
      });
    } catch (error) {
      // Não bloqueia o login se falhar o registro de auditoria
      console.error('Erro ao registrar histórico de login:', error);
    }
  }
}
