import { Controller, Post, UseGuards, Request, Body, HttpCode, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 1000, ttl: 60000 } }) // DEV: 1000 tentativas em 1 minuto para testes
  @ApiOperation({ summary: 'Autenticar usuário' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  async login(@Request() req: ExpressRequest & { user: any }, @Body() loginDto: LoginDto) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.authService.login(req.user, ip, userAgent);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: ExpressRequest,
    @Headers('x-forwarded-for') forwardedIp?: string,
    @Headers('user-agent') userAgent?: string
  ) {
    const ip = forwardedIp || req.ip || req.socket.remoteAddress;
    return this.authService.refreshToken(refreshTokenDto.refreshToken, ip, userAgent);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 1000, ttl: 60000 } }) // DEV: 1000 tentativas em 1 minuto para testes
  @ApiOperation({ summary: 'Solicitar reset de senha' })
  @ApiResponse({ status: 200, description: 'Email de recuperação enviado' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 1000, ttl: 60000 } }) // DEV: 1000 tentativas em 1 minuto para testes
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Request() req: ExpressRequest) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.authService.resetPassword(dto, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout do usuário atual' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(
    @Body() logoutDto: { refreshToken: string },
    @Request() req: ExpressRequest & { user: any },
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.authService.logout(logoutDto.refreshToken, req.user, ip, userAgent);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout de todos os dispositivos do usuário' })
  @ApiResponse({ status: 200, description: 'Logout de todos os dispositivos realizado com sucesso' })
  async logoutAll(@Request() req: ExpressRequest & { user: any }) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.authService.logoutAllDevices(req.user, ip, userAgent);
  }
}
