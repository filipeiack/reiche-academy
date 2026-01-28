import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from './email.service';
import { RefreshTokensService } from './refresh-tokens.service';
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
    private refreshTokensService: RefreshTokensService,
  ) {}

  async validateUser(email: string, senha: string, ip?: string, userAgent?: string): Promise<any> {
    const usuario = await this.usuariosService.findByEmail(email);
    
    if (!usuario || !usuario.ativo) {
      // Registra tentativa de login falhada
      await this.registrarLogin(null, email, false, 'Credenciais inválidas', ip, userAgent);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Usuários sem senha não podem fazer login
    if (!usuario.senha) {
      await this.registrarLogin(usuario.id, email, false, 'Usuário sem senha cadastrada', ip, userAgent);
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
      nome: usuario.nome,
      perfil: {
        codigo: usuario.perfil?.codigo || usuario.perfil,
        nivel: usuario.perfil?.nivel || 5,
      },
      empresaId: usuario.empresaId,
    };

    const accessToken = this.jwtService.sign(payload);
    
    // Create secure refresh token
    const refreshToken = await this.refreshTokensService.createRefreshToken(
      usuario.id,
      ip,
      userAgent
    );

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

  async refreshToken(oldRefreshToken: string, ip?: string, userAgent?: string) {
    try {
      // Validate the refresh token
      const usuario = await this.refreshTokensService.validateRefreshToken(oldRefreshToken);
      
      if (!usuario || !usuario.ativo) {
        throw new UnauthorizedException('Token inválido');
      }

      // Rotate the refresh token
      const newRefreshToken = await this.refreshTokensService.rotateRefreshToken(
        oldRefreshToken,
        ip,
        userAgent
      );

      // Generate new access token
      const payload = {
        sub: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        perfil: {
          codigo: usuario.perfil?.codigo || usuario.perfil,
          nivel: usuario.perfil?.nivel || 5,
        },
        empresaId: usuario.empresaId,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
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
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async logout(
    refreshToken: string,
    requestUser: { id: string; email: string },
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.refreshTokensService.invalidateToken(refreshToken);

    await this.registrarEventoAuth({
      usuarioId: requestUser.id,
      email: requestUser.email,
      sucesso: true,
      motivoFalha: null,
      evento: 'LOGOUT',
      ip,
      userAgent,
    });
  }

  async logoutAllDevices(
    requestUser: { id: string; email: string },
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.refreshTokensService.invalidateAllUserTokens(requestUser.id);

    await this.registrarEventoAuth({
      usuarioId: requestUser.id,
      email: requestUser.email,
      sucesso: true,
      motivoFalha: null,
      evento: 'LOGOUT_ALL',
      ip,
      userAgent,
    });
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

    // Validar se usuário tem email
    if (!usuario.email) {
      throw new BadRequestException('Usuário não possui email cadastrado');
    }

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
  async resetPassword(
    dto: ResetPasswordDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
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

    // Envia email de confirmação (se usuário tiver email)
    if (passwordReset.usuario.email) {
      await this.emailService.sendPasswordChangedEmail(
        passwordReset.usuario.email,
        passwordReset.usuario.nome,
      );
    }

    await this.registrarEventoAuth({
      usuarioId: passwordReset.usuarioId,
      email: passwordReset.usuario.email ?? '',
      sucesso: true,
      motivoFalha: null,
      evento: 'RESET_SENHA',
      ip,
      userAgent,
    });

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
    return this.registrarEventoAuth({
      usuarioId,
      email,
      sucesso,
      motivoFalha,
      evento: 'LOGIN',
      ip,
      userAgent,
    });
  }

  private async registrarEventoAuth(params: {
    usuarioId: string | null;
    email: string;
    sucesso: boolean;
    motivoFalha: string | null;
    evento: 'LOGIN' | 'LOGOUT' | 'LOGOUT_ALL' | 'RESET_SENHA';
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      let dispositivo: string | null = null;
      let navegador: string | null = null;

      // Parse básico do user agent
      if (params.userAgent) {
        const ua = params.userAgent.toLowerCase();
        
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
          usuarioId: params.usuarioId,
          email: params.email,
          sucesso: params.sucesso,
          motivoFalha: params.motivoFalha,
          evento: params.evento,
          ipAddress: params.ip,
          userAgent: params.userAgent,
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
