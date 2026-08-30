import { Injectable } from '@nestjs/common';

import { SEEDED_USER_ID } from '../config/app';

import { TransactionsRepository } from './transactions.repository';
import type { TransactionSummary, TransactionsResponse } from '@coffer/contracts';
import type { TransactionQueryDto } from './transaction-query.dto';
import type { TransactionRecord } from './transactions.repository';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const toSummary = (transaction: TransactionRecord): TransactionSummary => ({
  id: transaction.id,
  accountId: transaction.accountId,
  accountName: transaction.account.name,
  institution: {
    id: transaction.account.accessConsent.institutionId,
    name: transaction.account.accessConsent.institutionName,
    logo: transaction.account.accessConsent.institutionLogo,
    colour: transaction.account.accessConsent.institutionColour,
  },
  amount: transaction.amount.toFixed(2),
  direction: transaction.direction,
  currency: transaction.currency,
  bookedAt: transaction.bookedAt.toISOString().slice(0, 10),
  description: transaction.description,
  merchantName: transaction.merchantName,
  category: transaction.category,
  paymentMethod: transaction.paymentMethod,
  isInternalTransfer: transaction.isInternalTransfer,
});

const toDate = (value: string | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }

  return new Date(value);
};

@Injectable()
export class TransactionsService {
  constructor(private readonly transactions: TransactionsRepository) {}

  async list(query: TransactionQueryDto): Promise<TransactionsResponse> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const rows = await this.transactions.list({
      userId: SEEDED_USER_ID,
      accountId: query.accountId,
      from: toDate(query.from),
      to: toDate(query.to),
      counterparty: query.counterparty,
      cursor: query.cursor,
      take: limit + 1,
    });

    const page = rows.slice(0, limit);
    const last = page[page.length - 1];

    return {
      transactions: page.map(toSummary),
      nextCursor: rows.length > limit && last ? last.id : null,
    };
  }
}
