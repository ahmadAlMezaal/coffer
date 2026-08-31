import { Injectable } from '@nestjs/common';

import { Prisma } from '@coffer/database';

import { DatabaseService } from '../database/database.service';

const transactionDetail = {
  account: {
    select: {
      name: true,
      accessConsent: {
        select: {
          institutionId: true,
          institutionName: true,
          institutionLogo: true,
          institutionColour: true,
        },
      },
    },
  },
} satisfies Prisma.TransactionInclude;

export type TransactionRecord = Prisma.TransactionGetPayload<{
  include: typeof transactionDetail;
}>;

export type TransactionFilters = {
  userId: string;
  accountId?: string;
  category?: string;
  from?: Date;
  to?: Date;
  counterparty?: string;
  skip: number;
  take: number;
};

export type TransactionPage = {
  rows: TransactionRecord[];
  total: number;
};

const buildWhere = (filters: TransactionFilters): Prisma.TransactionWhereInput => {
  const where: Prisma.TransactionWhereInput = {
    removedAt: null,
    account: {
      accessConsent: { userId: filters.userId, status: { not: 'revoked' } },
    },
  };

  if (filters.accountId) {
    where.accountId = filters.accountId;
  }

  if (filters.category) {
    where.category = filters.category;
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

  return where;
};

@Injectable()
export class TransactionsRepository {
  constructor(private readonly database: DatabaseService) {}

  async list(filters: TransactionFilters): Promise<TransactionPage> {
    const where = buildWhere(filters);

    const [rows, total] = await this.database.client.$transaction([
      this.database.client.transaction.findMany({
        where,
        include: transactionDetail,
        orderBy: [{ bookedAt: 'desc' }, { id: 'desc' }],
        skip: filters.skip,
        take: filters.take,
      }),
      this.database.client.transaction.count({ where }),
    ]);

    return { rows, total };
  }

  async listCategories(userId: string): Promise<string[]> {
    const grouped = await this.database.client.transaction.groupBy({
      by: ['category'],
      where: {
        removedAt: null,
        category: { not: null },
        account: { accessConsent: { userId, status: { not: 'revoked' } } },
      },
      orderBy: { category: 'asc' },
    });

    return grouped
      .map((row) => row.category)
      .filter((category): category is string => category !== null);
  }
}
