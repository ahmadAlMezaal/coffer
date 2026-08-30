import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type { Account } from '@coffer/database';
import type { NormalisedAccount } from '@coffer/provider';

@Injectable()
export class AccountsRepository {
  constructor(private readonly database: DatabaseService) {}

  async upsertMany(accessConsentId: string, accounts: NormalisedAccount[]): Promise<number> {
    const writes = accounts.map((account) =>
      this.database.client.account.upsert({
        where: { providerAccountId: account.providerAccountId },
        create: {
          accessConsentId,
          providerAccountId: account.providerAccountId,
          name: account.name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          currency: account.currency,
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
        },
        update: {
          name: account.name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          currency: account.currency,
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
          balanceAsOf: new Date(),
        },
      }),
    );

    const written = await this.database.client.$transaction(writes);

    return written.length;
  }

  listForUser(userId: string): Promise<Account[]> {
    return this.database.client.account.findMany({
      where: { accessConsent: { userId, status: { not: 'revoked' } } },
      orderBy: [{ accessConsentId: 'asc' }, { name: 'asc' }],
    });
  }
}
