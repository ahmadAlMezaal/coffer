import { prisma } from '@coffer/database';
import type { NormalisedAccount } from '@coffer/provider';

export const upsertMany = async (
  accessConsentId: string,
  accounts: NormalisedAccount[],
  balanceAsOf: Date,
): Promise<void> => {
  await prisma.$transaction(
    accounts.map((account) =>
      prisma.account.upsert({
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
          balanceAsOf,
        },
        update: {
          name: account.name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          currency: account.currency,
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
          balanceAsOf,
        },
      }),
    ),
  );
};

export const idsByProviderAccountId = async (
  accessConsentId: string,
): Promise<Map<string, string>> => {
  const accounts = await prisma.account.findMany({
    where: { accessConsentId },
    select: { id: true, providerAccountId: true },
  });

  return new Map(accounts.map((account) => [account.providerAccountId, account.id]));
};

export const totalBalanceForUser = async (userId: string): Promise<number> => {
  const totals = await prisma.account.aggregate({
    where: { accessConsent: { userId, status: { not: 'revoked' } } },
    _sum: { currentBalance: true },
  });

  return Number(totals._sum.currentBalance ?? 0);
};
