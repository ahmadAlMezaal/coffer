import { Injectable } from '@nestjs/common';

import { isCashAccount } from '@coffer/provider';

import { SEEDED_USER_ID } from '../config/app';
import { ConsentsRepository } from '../consents/consents.repository';

import { AccountsRepository } from './accounts.repository';
import type { AccountGroup, AccountSummary, AccountsResponse } from '@coffer/contracts';
import type { Account } from '@coffer/database';

const DEFAULT_CURRENCY = 'GBP';

const toSummary = (account: Account): AccountSummary => ({
  id: account.id,
  consentId: account.accessConsentId,
  name: account.name,
  mask: account.mask,
  type: account.type,
  subtype: account.subtype,
  isCash: isCashAccount(account.type),
  currency: account.currency,
  currentBalance: account.currentBalance.toFixed(2),
  availableBalance: account.availableBalance === null ? null : account.availableBalance.toFixed(2),
  balanceAsOf: account.balanceAsOf.toISOString(),
});

@Injectable()
export class AccountsService {
  constructor(
    private readonly accounts: AccountsRepository,
    private readonly consents: ConsentsRepository,
  ) {}

  async list(): Promise<AccountsResponse> {
    const [accounts, consents] = await Promise.all([
      this.accounts.listForUser(SEEDED_USER_ID),
      this.consents.listForUser(SEEDED_USER_ID),
    ]);

    const groups: AccountGroup[] = consents.map((consent) => ({
      consentId: consent.id,
      institution: {
        id: consent.institutionId,
        name: consent.institutionName,
        logo: consent.institutionLogo,
        colour: consent.institutionColour,
      },
      status: consent.status,
      expiresAt: consent.expiresAt === null ? null : consent.expiresAt.toISOString(),
      lastSyncedAt: consent.lastSyncedAt === null ? null : consent.lastSyncedAt.toISOString(),
      accounts: accounts.filter((account) => account.accessConsentId === consent.id).map(toSummary),
    }));

    const cash = accounts.filter((account) => isCashAccount(account.type));

    const totalBalance = cash.reduce(
      (running, account) => running + Number(account.currentBalance),
      0,
    );

    return {
      groups,
      totalBalance: totalBalance.toFixed(2),
      currency: cash[0]?.currency ?? accounts[0]?.currency ?? DEFAULT_CURRENCY,
    };
  }
}
