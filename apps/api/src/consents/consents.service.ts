import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { AccountsRepository } from '../accounts/accounts.repository';
import { SEEDED_USER_EMAIL, SEEDED_USER_ID } from '../config/app';
import { ProviderService } from '../provider/provider.service';
import { TemporalService } from '../temporal/temporal.service';

import { ConsentsRepository } from './consents.repository';
import type {
  ConsentSummary,
  ConsentsResponse,
  CreateConsentResponse,
  RevokeConsentResponse,
} from '@coffer/contracts';
import type { Institution } from '@coffer/provider';
import type { ConsentRecord } from './consents.repository';

const toSummary = (consent: ConsentRecord): ConsentSummary => {
  const lastRun = consent.syncRuns[0] ?? null;

  return {
    id: consent.id,
    provider: consent.provider,
    institution: {
      id: consent.institutionId,
      name: consent.institutionName,
      logo: consent.institutionLogo,
      colour: consent.institutionColour,
    },
    status: consent.status,
    consentedAt: consent.consentedAt.toISOString(),
    expiresAt: consent.expiresAt === null ? null : consent.expiresAt.toISOString(),
    lastSyncedAt: consent.lastSyncedAt === null ? null : consent.lastSyncedAt.toISOString(),
    accountCount: consent._count.accounts,
    lastSyncStatus: lastRun === null ? null : lastRun.status,
    lastSyncError: lastRun === null ? null : lastRun.error,
  };
};

const needsBranding = (consent: ConsentRecord): boolean =>
  consent.institutionId !== null && consent.institutionRefreshedAt === null;

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

    await this.backfillBranding(consents);

    const refreshed = consents.some(needsBranding)
      ? await this.consents.listForUser(SEEDED_USER_ID)
      : consents;

    return { consents: refreshed.map(toSummary) };
  }

  async create(publicToken: string): Promise<CreateConsentResponse> {
    await this.consents.ensureUser(SEEDED_USER_ID, SEEDED_USER_EMAIL);

    const exchanged = await this.provider.exchangePublicToken(publicToken);
    const institution = await this.institution(exchanged.data.institutionId);

    const consent = await this.consents.upsertByProviderItem({
      userId: SEEDED_USER_ID,
      providerItemId: exchanged.data.providerItemId,
      accessToken: exchanged.data.accessToken,
      institutionId: exchanged.data.institutionId,
      institutionName: institution?.name ?? null,
      institutionLogo: institution?.logo ?? null,
      institutionColour: institution?.colour ?? null,
      expiresAt:
        exchanged.data.consentExpiresAt === null ? null : new Date(exchanged.data.consentExpiresAt),
    });

    await this.consents.writeRawPayload(consent.id, exchanged.raw);

    const fetched = await this.provider.fetchAccounts(exchanged.data.accessToken);

    await this.consents.writeRawPayload(consent.id, fetched.raw);

    const accountsLinked = await this.accounts.upsertMany(consent.id, fetched.data);

    await this.temporal.startSync(consent.id);

    return { consentId: consent.id, status: consent.status, accountsLinked };
  }

  async revoke(consentId: string): Promise<RevokeConsentResponse> {
    const consent = await this.consents.findForUser(SEEDED_USER_ID, consentId);

    if (consent === null) {
      throw new NotFoundException(`No linked bank with id ${consentId}`);
    }

    await this.temporal.stopSync(consent.id);

    try {
      await this.provider.removeItem(consent.accessToken);
    } catch {
      this.logger.warn(`Plaid would not remove item ${consent.providerItemId}, revoking anyway`);
    }

    await this.consents.revoke(consent.id);

    return { consentId: consent.id, status: 'revoked' };
  }

  private async backfillBranding(consents: ConsentRecord[]): Promise<void> {
    for (const consent of consents.filter(needsBranding)) {
      const institution = await this.institution(consent.institutionId);

      await this.consents.saveInstitution(consent.id, {
        name: institution?.name ?? consent.institutionName,
        logo: institution?.logo ?? null,
        colour: institution?.colour ?? null,
      });
    }
  }

  private async institution(institutionId: string | null): Promise<Institution | null> {
    if (institutionId === null) {
      return null;
    }

    try {
      return await this.provider.fetchInstitution(institutionId);
    } catch {
      this.logger.warn(`Could not read the branding of institution ${institutionId}`);

      return null;
    }
  }
}
