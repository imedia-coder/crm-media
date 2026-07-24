import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';

const SAFE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  status: true,
  mfaEnabledAt: true,
  anonymizedAt: true,
  role: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll() {
    return this.tenantPrisma.client.user.findMany({
      where: { isClient: false },
      select: SAFE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneOrThrow(id: string) {
    const user = await this.tenantPrisma.client.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * RGPD right of access: every piece of personal data this tenant holds
   * about this collaborator, for a data-subject-access request.
   */
  async exportPersonalData(id: string) {
    const user = await this.tenantPrisma.client.user.findUnique({
      where: { id },
      include: {
        role: { select: { name: true } },
        ownedDeals: { select: { id: true, title: true, createdAt: true } },
        ownedProjects: { select: { id: true, name: true, createdAt: true } },
        assignedTasks: { select: { id: true, title: true, status: true } },
        _count: { select: { timeEntries: true, uploadedDocs: true, authoredContent: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      exportedAt: new Date().toISOString(),
      identity: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        mfaEnabledAt: user.mfaEnabledAt,
      },
      role: user.role?.name ?? null,
      ownedDeals: user.ownedDeals,
      ownedProjects: user.ownedProjects,
      assignedTasks: user.assignedTasks,
      activitySummary: {
        timeEntriesLogged: user._count.timeEntries,
        documentVersionsUploaded: user._count.uploadedDocs,
        contentItemsAuthored: user._count.authoredContent,
      },
      recordCreatedAt: user.createdAt,
      recordLastUpdatedAt: user.updatedAt,
    };
  }

  /**
   * RGPD right to erasure for a collaborator who has left the agency.
   * Scrubs identifying fields, disables the account and revokes every
   * refresh token so it can no longer authenticate; deals/tasks/projects
   * they owned are kept as the agency's own business records but will
   * display "Anonymisé" instead of their name. Self-anonymization is
   * blocked to avoid a caller locking themselves out mid-session.
   */
  async anonymize(id: string, callerId: string) {
    if (id === callerId) {
      throw new ConflictException('You cannot anonymize your own account while signed in with it');
    }
    const existing = await this.findOneOrThrow(id);
    if (existing.anonymizedAt) return existing;

    await this.tenantPrisma.transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          firstName: 'Anonymisé',
          lastName: '',
          email: `anonymized-${id}@deleted.local`,
          passwordHash: '',
          mfaSecret: null,
          mfaEnabledAt: null,
          status: 'DISABLED',
          anonymizedAt: new Date(),
        },
      });
      await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    });

    return this.findOneOrThrow(id);
  }
}
