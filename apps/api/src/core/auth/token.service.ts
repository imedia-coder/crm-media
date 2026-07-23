import { randomBytes, createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PlatformPrismaService } from '../prisma/platform-prisma.service';
import { AuthenticatedUser, JwtPayload } from './types/jwt-payload.interface';

const REFRESH_TOKEN_BYTES = 48;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly platformPrisma: PlatformPrismaService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  signAccessToken(user: AuthenticatedUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
      permissions: user.permissions,
      isClient: user.isClient,
      companyId: user.companyId,
    };
    return this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  async issueRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const ttlMs = this.parseTtlMs(process.env.JWT_REFRESH_TTL ?? '7d');
    await this.platformPrisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
    return token;
  }

  async issueTokenPair(user: AuthenticatedUser): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.issueRefreshToken(user.id),
    ]);
    return { accessToken, refreshToken };
  }

  async consumeRefreshToken(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    const record = await this.platformPrisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: { include: { permissions: true } } } } },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.platformPrisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return record.user;
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hash(refreshToken);
    await this.platformPrisma.refreshToken
      .updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }

  private parseTtlMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = Number(match[1]);
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as 's' | 'm' | 'h' | 'd'];
    return value * unitMs;
  }
}
