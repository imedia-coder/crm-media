import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DEFAULT_PIPELINE_STAGES } from '../../modules/crm/pipeline-stages/default-stages';
import { PlatformPrismaService } from '../prisma/platform-prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MfaService } from './mfa.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { AuthenticatedUser } from './types/jwt-payload.interface';

type UserWithRole = {
  id: string;
  tenantId: string;
  roleId: string | null;
  isClient: boolean;
  companyId: string | null;
  role: { permissions: { action: string }[] } | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly platformPrisma: PlatformPrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly mfaService: MfaService,
  ) {}

  private toAuthenticatedUser(user: UserWithRole): AuthenticatedUser {
    return {
      id: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
      isClient: user.isClient,
      companyId: user.companyId,
      permissions: user.role?.permissions.map((p) => p.action) ?? [],
    };
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'agency';

    let slug = base;
    let suffix = 1;
    while (await this.platformPrisma.tenant.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  async register(dto: RegisterDto) {
    const slug = await this.uniqueSlug(dto.tenantName);
    const passwordHash = await this.passwordService.hash(dto.password);

    const { tenant, user } = await this.platformPrisma
      .$transaction(async (tx) => {
        const tenant = await tx.tenant.create({ data: { name: dto.tenantName, slug } });
        const role = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: 'Admin',
            permissions: { create: [{ action: '*' }] },
          },
        });
        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            status: 'ACTIVE',
            roleId: role.id,
          },
          include: { role: { include: { permissions: true } } },
        });
        await tx.pipelineStage.createMany({
          data: DEFAULT_PIPELINE_STAGES.map((stage) => ({ ...stage, tenantId: tenant.id })),
        });
        return { tenant, user };
      })
      .catch((error) => {
        if (error?.code === 'P2002') {
          throw new ConflictException('Email already in use');
        }
        throw error;
      });

    const authenticatedUser = this.toAuthenticatedUser(user);
    const tokens = await this.tokenService.issueTokenPair(authenticatedUser);
    return {
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const invalid = () => new UnauthorizedException('Invalid credentials');

    const tenant = await this.platformPrisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw invalid();

    const user = await this.platformPrisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
      include: { role: { include: { permissions: true } } },
    });
    if (!user || user.status !== 'ACTIVE') throw invalid();

    const passwordMatches = await this.passwordService.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw invalid();

    if (user.mfaEnabledAt) {
      if (!dto.mfaCode || !this.mfaService.verify(dto.mfaCode, user.mfaSecret as string)) {
        throw new UnauthorizedException('Valid MFA code required');
      }
    }

    const authenticatedUser = this.toAuthenticatedUser(user);
    const tokens = await this.tokenService.issueTokenPair(authenticatedUser);
    return {
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const user = await this.tokenService.consumeRefreshToken(refreshToken);
    const authenticatedUser = this.toAuthenticatedUser(user);
    return this.tokenService.issueTokenPair(authenticatedUser);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async setupMfa(userId: string) {
    const user = await this.platformPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = this.mfaService.generateSecret();
    await this.platformPrisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });
    const otpAuthUrl = this.mfaService.keyUri(user.email, secret);
    const qrCode = await this.mfaService.toQrCodeDataUrl(otpAuthUrl);
    return { secret, otpAuthUrl, qrCode };
  }

  async enableMfa(userId: string, code: string): Promise<void> {
    const user = await this.platformPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaSecret || !this.mfaService.verify(code, user.mfaSecret)) {
      throw new UnauthorizedException('Invalid MFA code');
    }
    await this.platformPrisma.user.update({ where: { id: userId }, data: { mfaEnabledAt: new Date() } });
  }

  async disableMfa(userId: string, code: string): Promise<void> {
    const user = await this.platformPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaSecret || !this.mfaService.verify(code, user.mfaSecret)) {
      throw new UnauthorizedException('Invalid MFA code');
    }
    await this.platformPrisma.user.update({
      where: { id: userId },
      data: { mfaSecret: null, mfaEnabledAt: null },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.platformPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    const matches = await this.passwordService.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const passwordHash = await this.passwordService.hash(newPassword);
    await this.platformPrisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
