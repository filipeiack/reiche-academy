import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

@Injectable()
export class RefreshTokensService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createRefreshToken(userId: string, ip?: string, userAgent?: string): Promise<string> {
    // Invalidate all existing tokens for this user (single session per user)
    await this.invalidateAllUserTokens(userId);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        ipAddress: ip,
        userAgent,
        dispositivo: this.extractDevice(userAgent),
      },
    });

    return token;
  }

  async validateRefreshToken(token: string): Promise<any> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nome: true,
            cargo: true,
            telefone: true,
            fotoUrl: true,
            ativo: true,
            empresaId: true,
            perfil: {
              select: {
                id: true,
                codigo: true,
                nome: true,
                nivel: true,
              },
            },
            empresa: {
              select: {
                id: true,
                nome: true,
                cnpj: true,
                cidade: true,
                estado: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!storedToken || !storedToken.isActive || storedToken.expiresAt < new Date()) {
      await this.invalidateToken(token);
      throw new Error('Token inválido ou expirado');
    }

    return storedToken.user;
  }

  async rotateRefreshToken(oldToken: string, newIp?: string, newUserAgent?: string): Promise<string> {
    const oldStoredToken = await this.prisma.refreshToken.findUnique({
      where: { token: oldToken },
    });

    if (!oldStoredToken) {
      throw new Error('Token antigo não encontrado');
    }

    // Invalidate old token
    await this.invalidateToken(oldToken);

    // Create new token
    return this.createRefreshToken(oldStoredToken.userId, newIp, newUserAgent);
  }

  async invalidateToken(token: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token },
      data: { isActive: false },
    });
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false },
        ],
      },
    });
  }

  private extractDevice(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Desktop';
    if (userAgent.includes('Mac')) return 'Desktop';
    if (userAgent.includes('Linux')) return 'Desktop';
    
    return 'Unknown';
  }
}