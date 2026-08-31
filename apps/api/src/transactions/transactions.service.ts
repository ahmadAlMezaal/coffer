import { BadRequestException, Injectable } from '@nestjs/common';

import { SEEDED_USER_ID } from '../config/app';

import { describeRangeProblem } from './date-range';
import { TransactionsRepository } from './transactions.repository';
import type {
  TransactionCategoriesResponse,
  TransactionSummary,
  TransactionsResponse,
} from '@coffer/contracts';
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
    const problem = describeRangeProblem({ from: query.from, to: query.to }, new Date());

    if (problem !== null) {
      throw new BadRequestException(problem);
    }

    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = query.offset ?? 0;

    const page = await this.transactions.list({
      userId: SEEDED_USER_ID,
      accountId: query.accountId,
      category: query.category,
      from: toDate(query.from),
      to: toDate(query.to),
      counterparty: query.counterparty,
      skip: offset,
      take: limit,
    });

    return {
      transactions: page.rows.map(toSummary),
      total: page.total,
      offset,
      limit,
    };
  }

  async listCategories(): Promise<TransactionCategoriesResponse> {
    return { categories: await this.transactions.listCategories(SEEDED_USER_ID) };
  }
}
