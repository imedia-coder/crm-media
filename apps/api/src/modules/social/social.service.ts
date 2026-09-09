import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SocialAccountStatus,
  SocialCapabilityKind,
} from '@prisma/client';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { ListSocialAccountsQuery } from './dto/list-social-accounts.query';
import { SetCapabilityDto } from './dto/set-capability.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

/**
 * Ne renvoie jamais les colonnes de token — cf. le commentaire du modèle
 * `SocialAccount` et la posture de `WhatsAppChannel.whapiToken`.
 */
const ACCOUNT_SELECT = {
  id: true,
  tenantId: true,
  companyId: true,
  network: true,
  externalId: true,
  handle: true,
  scopes: true,
  tokenExpiresAt: true,
  status: true,
  lastSyncAt: true,
  createdAt: true,
  updatedAt: true,
  capability: { select: { capability: true, reason: true, checkedAt: true } },
} satisfies Prisma.SocialAccountSelect;

@Injectable()
export class SocialService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll(query: ListSocialAccountsQuery) {
    return this.tenantPrisma.client.socialAccount.findMany({
      where: {
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.network ? { network: query.network } : {}),
      },
      select: ACCOUNT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const account = await this.tenantPrisma.client.socialAccount.findUnique({
      where: { id },
      select: ACCOUNT_SELECT,
    });
    if (!account) throw new NotFoundException('Social account not found');
    return account;
  }

  async create(dto: CreateSocialAccountDto) {
    const tenantId = this.tenantPrisma.tenantId;
    try {
      return await this.tenantPrisma.client.socialAccount.create({
        data: {
          tenantId,
          companyId: dto.companyId,
          network: dto.network,
          handle: dto.handle,
          externalId: dto.externalId,
          scopes: dto.scopes ?? [],
          tokenExpiresAt: dto.tokenExpiresAt
            ? new Date(dto.tokenExpiresAt)
            : undefined,
          status: dto.status ?? SocialAccountStatus.PENDING,
          capability: {
            create: {
              tenantId,
              capability: dto.capability ?? SocialCapabilityKind.UNVERIFIED,
            },
          },
        },
        select: ACCOUNT_SELECT,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'Ce réseau est déjà connecté pour ce client',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateSocialAccountDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.socialAccount.update({
      where: { id },
      data: {
        ...(dto.handle !== undefined ? { handle: dto.handle } : {}),
        ...(dto.externalId !== undefined ? { externalId: dto.externalId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.scopes !== undefined ? { scopes: dto.scopes } : {}),
        ...(dto.tokenExpiresAt !== undefined
          ? {
              tokenExpiresAt: dto.tokenExpiresAt
                ? new Date(dto.tokenExpiresAt)
                : null,
            }
          : {}),
        ...(dto.touchSync ? { lastSyncAt: new Date() } : {}),
      },
      select: ACCOUNT_SELECT,
    });
  }

  async setCapability(id: string, dto: SetCapabilityDto) {
    await this.findOneOrThrow(id);
    const tenantId = this.tenantPrisma.tenantId;
    await this.tenantPrisma.client.socialAccountCapability.upsert({
      where: { accountId: id },
      create: {
        tenantId,
        accountId: id,
        capability: dto.capability,
        reason: dto.reason,
      },
      update: {
        capability: dto.capability,
        reason: dto.reason ?? null,
        checkedAt: new Date(),
      },
    });
    return this.findOneOrThrow(id);
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.socialAccount.delete({ where: { id } });
  }
}
