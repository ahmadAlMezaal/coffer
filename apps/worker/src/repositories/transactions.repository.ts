import { prisma } from '@coffer/database';
import type { NormalisedTransaction, RemovedTransactionRef } from '@coffer/provider';
import type { TransferCandidate, TransferPair } from '../domain/internal-transfers';

export const upsertAdded = async (
  transactions: NormalisedTransaction[],
  accountIds: Map<string, string>,
): Promise<number> => {
  const writable = transactions.filter(
    (transaction) => !transaction.pending && accountIds.has(transaction.providerAccountId),
  );

  await prisma.$transaction(
    writable.map((transaction) => {
      const accountId = accountIds.get(transaction.providerAccountId) as string;

      return prisma.transaction.upsert({
        where: { providerTransactionId: transaction.providerTransactionId },
        create: {
          accountId,
          providerTransactionId: transaction.providerTransactionId,
          amount: transaction.amount,
          direction: transaction.direction,
          currency: transaction.currency,
          bookedAt: new Date(transaction.bookedAt),
          description: transaction.description,
          merchantName: transaction.merchantName,
          category: transaction.category,
          paymentMethod: transaction.paymentMethod,
        },
        update: {
          accountId,
          amount: transaction.amount,
          direction: transaction.direction,
          currency: transaction.currency,
          bookedAt: new Date(transaction.bookedAt),
          description: transaction.description,
          merchantName: transaction.merchantName,
          category: transaction.category,
          paymentMethod: transaction.paymentMethod,
          removedAt: null,
        },
      });
    }),
  );

  return writable.length;
};

export const applyModified = async (transactions: NormalisedTransaction[]): Promise<number> => {
  const results = await prisma.$transaction(
    transactions.map((transaction) =>
      prisma.transaction.updateMany({
        where: { providerTransactionId: transaction.providerTransactionId },
        data: {
          amount: transaction.amount,
          direction: transaction.direction,
          currency: transaction.currency,
          bookedAt: new Date(transaction.bookedAt),
          description: transaction.description,
          merchantName: transaction.merchantName,
          category: transaction.category,
          paymentMethod: transaction.paymentMethod,
        },
      }),
    ),
  );

  return results.reduce((running, result) => running + result.count, 0);
};

export const applyRemoved = async (
  removed: RemovedTransactionRef[],
  removedAt: Date,
): Promise<number> => {
  if (removed.length === 0) {
    return 0;
  }

  const result = await prisma.transaction.updateMany({
    where: {
      providerTransactionId: { in: removed.map((entry) => entry.providerTransactionId) },
      removedAt: null,
    },
    data: { removedAt },
  });

  return result.count;
};

export const listTransferCandidates = async (
  userId: string,
  since: Date,
): Promise<TransferCandidate[]> => {
  const rows = await prisma.transaction.findMany({
    where: {
      removedAt: null,
      bookedAt: { gte: since },
      account: { accessConsent: { userId, status: { not: 'revoked' } } },
    },
    select: { id: true, accountId: true, amount: true, direction: true, bookedAt: true },
    orderBy: { bookedAt: 'asc' },
  });

  return rows.map((row) => ({
    id: row.id,
    accountId: row.accountId,
    amount: row.amount.toFixed(2),
    direction: row.direction,
    bookedAt: row.bookedAt,
  }));
};

export const markTransferPairs = async (pairs: TransferPair[]): Promise<number> => {
  if (pairs.length === 0) {
    return 0;
  }

  await prisma.$transaction(
    pairs.flatMap((pair) => [
      prisma.transaction.update({
        where: { id: pair.outgoingId },
        data: { isInternalTransfer: true, internalTransferPairId: pair.incomingId },
      }),
      prisma.transaction.update({
        where: { id: pair.incomingId },
        data: { isInternalTransfer: true, internalTransferPairId: pair.outgoingId },
      }),
    ]),
  );

  return pairs.length;
};

export const monthTotals = async (
  userId: string,
  start: Date,
  end: Date,
): Promise<{ inflow: number; outflow: number }> => {
  const grouped = await prisma.transaction.groupBy({
    by: ['direction'],
    where: {
      removedAt: null,
      isInternalTransfer: false,
      bookedAt: { gte: start, lte: end },
      account: { accessConsent: { userId, status: { not: 'revoked' } } },
    },
    _sum: { amount: true },
  });

  const total = (direction: 'in' | 'out'): number =>
    Number(grouped.find((row) => row.direction === direction)?._sum.amount ?? 0);

  return { inflow: total('in'), outflow: total('out') };
};
