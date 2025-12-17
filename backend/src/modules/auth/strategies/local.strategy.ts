import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ 
      usernameField: 'email',
      passwordField: 'senha',
      passReqToCallback: true // Permite acessar req no validate
    });
  }

  async validate(req: any, email: string, senha: string): Promise<any> {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const user = await this.authService.validateUser(email, senha, ip, userAgent);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
