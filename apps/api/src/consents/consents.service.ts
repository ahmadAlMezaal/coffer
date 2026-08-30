import { Injectable, Logger } from '@nestjs/common';

import { AccountsRepository } from '../accounts/accounts.repository';
import { SEEDED_USER_EMAIL, SEEDED_USER_ID } from '../config/app';
import { ProviderService } from '../provider/provider.service';
import { TemporalService } from '../temporal/temporal.service';

import { ConsentsRepository } from './consents.repository';
import type { ConsentSummary, ConsentsResponse, CreateConsentResponse } from '@coffer/contracts';
import type { ConsentRecord } from './consents.repository';

const toSummary = (consent: ConsentRecord): ConsentSummary => {
  const lastRun = consent.syncRuns[0] ?? null;

  return {
    id: consent.id,
    provider: consent.provider,
    institutionName: consent.institutionName,
    status: consent.status,
    consentedAt: consent.consentedAt.toISOString(),
    lastSyncedAt: consent.lastSyncedAt === null ? null : consent.lastSyncedAt.toISOString(),
    accountCount: consent._count.accounts,
    lastSyncStatus: lastRun === null ? null : lastRun.status,
    lastSyncError: lastRun === null ? null : lastRun.error,
  };
};

@Injectable()
export class ConsentsService {
  private readonly logger = new Logger(ConsentsService.name);

  constructor(
    private readonly consents: ConsentsRepository,
    private readonly accounts: AccountsRepository,
    private readonly provider: ProviderService,
    private readonly temporal: TemporalService,
  ) {}

  async list(): Promise<ConsentsResponse> {
    const consents = await this.consents.listForUser(SEEDED_USER_ID);

    return { consents: consents.map(toSummary) };
  }

  async create(publicToken: string): Promise<CreateConsentResponse> {
    await this.consents.ensureUser(SEEDED_USER_ID, SEEDED_USER_EMAIL);

    const exchanged = await this.provider.exchangePublicToken(publicToken);
    const institutionName = await this.institutionName(exchanged.data.institutionId);

    const consent = await this.consents.upsertByProviderItem({
      userId: SEEDED_USER_ID,
      providerItemId: exchanged.data.providerItemId,
      accessToken: exchanged.data.accessToken,
      institutionId: exchanged.data.institutionId,
      institutionName,
    });

    await this.consents.writeRawPayload(consent.id, exchanged.raw);

    const fetched = await this.provider.fetchAccounts(exchanged.data.accessToken);

    await this.consents.writeRawPayload(consent.id, fetched.raw);

    const accountsLinked = await this.accounts.upsertMany(consent.id, fetched.data);

    await this.temporal.startSync(consent.id);

    return { consentId: consent.id, status: consent.status, accountsLinked };
  }

  private async institutionName(institutionId: string | null): Promise<string | null> {
    if (institutionId === null) {
      return null;
    }

    try {
      return await this.provider.fetchInstitutionName(institutionId);
    } catch {
      this.logger.warn(`Could not read the name of institution ${institutionId}`);

      return null;
    }
  }
}
