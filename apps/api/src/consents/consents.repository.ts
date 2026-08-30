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

  upsertByProviderItem(input: {
    userId: string;
    providerItemId: string;
    accessToken: string;
    institutionId: string | null;
    institutionName: string | null;
  }): Promise<AccessConsent> {
    return this.database.client.accessConsent.upsert({
      where: { providerItemId: input.providerItemId },
      create: {
        userId: input.userId,
        providerItemId: input.providerItemId,
        accessToken: input.accessToken,
        institutionId: input.institutionId,
        institutionName: input.institutionName,
        status: 'processing',
      },
      update: {
        accessToken: input.accessToken,
        institutionId: input.institutionId,
        institutionName: input.institutionName,
        status: 'processing',
      },
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
