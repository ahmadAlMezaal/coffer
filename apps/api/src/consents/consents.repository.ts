import { Injectable } from '@nestjs/common';

import { Prisma } from '@coffer/database';

import { DatabaseService } from '../database/database.service';
import type { AccessConsent } from '@coffer/database';
import type { RawCapture } from '@coffer/provider';

const consentDetail = {
  _count: { select: { accounts: true } },
  syncRuns: { orderBy: { startedAt: 'desc' }, take: 1 },
} satisfies Prisma.AccessConsentInclude;

export type ConsentRecord = Prisma.AccessConsentGetPayload<{ include: typeof consentDetail }>;

@Injectable()
export class ConsentsRepository {
  constructor(private readonly database: DatabaseService) {}

  listForUser(userId: string): Promise<ConsentRecord[]> {
    return this.database.client.accessConsent.findMany({
      where: { userId, status: { not: 'revoked' } },
      include: consentDetail,
      orderBy: { consentedAt: 'asc' },
    });
  }

  findForUser(userId: string, consentId: string): Promise<AccessConsent | null> {
    return this.database.client.accessConsent.findFirst({
      where: { id: consentId, userId, status: { not: 'revoked' } },
    });
  }

  upsertByProviderItem(input: {
    userId: string;
    providerItemId: string;
    accessToken: string;
    institutionId: string | null;
    institutionName: string | null;
    institutionLogo: string | null;
    institutionColour: string | null;
    expiresAt: Date | null;
  }): Promise<AccessConsent> {
    const branding = {
      institutionId: input.institutionId,
      institutionName: input.institutionName,
      institutionLogo: input.institutionLogo,
      institutionColour: input.institutionColour,
      institutionRefreshedAt: new Date(),
      expiresAt: input.expiresAt,
    };

    return this.database.client.accessConsent.upsert({
      where: { providerItemId: input.providerItemId },
      create: {
        userId: input.userId,
        providerItemId: input.providerItemId,
        accessToken: input.accessToken,
        status: 'processing',
        ...branding,
      },
      update: {
        accessToken: input.accessToken,
        status: 'processing',
        ...branding,
      },
    });
  }

  async saveInstitution(
    consentId: string,
    institution: { name: string | null; logo: string | null; colour: string | null },
  ): Promise<void> {
    await this.database.client.accessConsent.update({
      where: { id: consentId },
      data: {
        institutionName: institution.name,
        institutionLogo: institution.logo,
        institutionColour: institution.colour,
        institutionRefreshedAt: new Date(),
      },
    });
  }

  async revoke(consentId: string): Promise<void> {
    await this.database.client.accessConsent.update({
      where: { id: consentId },
      data: { status: 'revoked' },
    });
  }

  async writeRawPayload(accessConsentId: string, raw: RawCapture): Promise<void> {
    await this.database.client.rawProviderPayload.create({
      data: {
        accessConsentId,
        endpoint: raw.endpoint,
        requestCursor: raw.requestCursor,
        responseBody: raw.responseBody as Prisma.InputJsonValue,
        responseHash: raw.responseHash,
        httpStatus: raw.httpStatus,
      },
    });
  }

  async ensureUser(userId: string, email: string): Promise<void> {
    await this.database.client.user.upsert({
      where: { id: userId },
      create: { id: userId, email },
      update: {},
    });
  }
}
