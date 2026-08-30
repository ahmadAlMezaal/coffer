import { daysBetween } from './calendar';

const MAX_DAYS_APART = 3;

export type TransferCandidate = {
  id: string;
  accountId: string;
  amount: string;
  direction: 'in' | 'out';
  bookedAt: Date;
};

export type TransferPair = {
  outgoingId: string;
  incomingId: string;
};

export const pairInternalTransfers = (candidates: TransferCandidate[]): TransferPair[] => {
  const outgoing = candidates.filter((candidate) => candidate.direction === 'out');
  const incoming = candidates.filter((candidate) => candidate.direction === 'in');
  const claimed = new Set<string>();
  const pairs: TransferPair[] = [];

  for (const debit of outgoing) {
    const match = incoming.find((credit) => {
      if (claimed.has(credit.id)) {
        return false;
      }

      if (credit.accountId === debit.accountId) {
        return false;
      }

      if (credit.amount !== debit.amount) {
        return false;
      }

      return daysBetween(credit.bookedAt, debit.bookedAt) <= MAX_DAYS_APART;
    });

    if (!match) {
      continue;
    }

    claimed.add(match.id);
    pairs.push({ outgoingId: debit.id, incomingId: match.id });
  }

  return pairs;
};
