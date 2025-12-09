import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, senha: string): Promise<any> {
    const usuario = await this.usuariosService.findByEmail(email);
    
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await argon2.verify(usuario.senha, senha);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const { senha: _, ...result } = usuario;
    return result;
  }

  async login(usuario: any) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      empresaId: usuario.empresaId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

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
        fotoUrl: usuario.fotoUrl,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const usuario = await this.usuariosService.findById(payload.sub);
      
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
}
