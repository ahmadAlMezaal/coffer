import { Injectable } from '@nestjs/common';

import { Prisma } from '@coffer/database';

import { DatabaseService } from '../database/database.service';

const transactionDetail = {
  account: { select: { name: true } },
} satisfies Prisma.TransactionInclude;

export type TransactionRecord = Prisma.TransactionGetPayload<{
  include: typeof transactionDetail;
}>;

export type TransactionFilters = {
  userId: string;
  accountId?: string;
  from?: Date;
  to?: Date;
  counterparty?: string;
  cursor?: string;
  take: number;
};

@Injectable()
export class TransactionsRepository {
  constructor(private readonly database: DatabaseService) {}

  list(filters: TransactionFilters): Promise<TransactionRecord[]> {
    const where: Prisma.TransactionWhereInput = {
      removedAt: null,
      account: {
        accessConsent: { userId: filters.userId, status: { not: 'revoked' } },
      },
    };

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.from || filters.to) {
      where.bookedAt = { gte: filters.from, lte: filters.to };
    }

    if (filters.counterparty) {
      where.OR = [
        { description: { contains: filters.counterparty, mode: 'insensitive' } },
        { merchantName: { contains: filters.counterparty, mode: 'insensitive' } },
      ];
    }

    return this.database.client.transaction.findMany({
      where,
      include: transactionDetail,
      orderBy: [{ bookedAt: 'desc' }, { id: 'desc' }],
      take: filters.take,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });
  }
}
