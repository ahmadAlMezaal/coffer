import { STALE_AFTER_HOURS } from '../config';
import * as api from '../repositories/coffer-api.repository';
import type {
  AccountsResponse,
  ConsentSummary,
  StatsResponse,
  TransactionQuery,
  TransactionsResponse,
} from '@coffer/contracts';

export type DashboardState = 'empty' | 'syncing' | 'ready' | 'stale' | 'unreachable';

export type Dashboard = {
  state: DashboardState;
  consents: ConsentSummary[];
  accounts: AccountsResponse;
  transactions: TransactionsResponse;
  stats: StatsResponse;
  lastSyncedAt: string | null;
  syncError: string | null;
};

const emptyAccounts: AccountsResponse = { groups: [], totalBalance: '0.00', currency: 'GBP' };

const emptyStats: StatsResponse = {
  currency: 'GBP',
  totalBalance: '0.00',
  monthlyInflow: '0.00',
  monthlyOutflow: '0.00',
  inflowChangePercent: null,
  outflowChangePercent: null,
  netBurn: '0.00',
  runwayDays: null,
  runwayLabel: '—',
  cashZeroAt: null,
  periodStart: '',
  periodEnd: '',
  computedAt: null,
  projection: [],
};

const mostRecent = (consents: ConsentSummary[]): string | null => {
  const timestamps = consents
    .map((consent) => consent.lastSyncedAt)
    .filter((value): value is string => value !== null);

  if (timestamps.length === 0) {
    return null;
  }

  return timestamps.sort().reverse()[0] ?? null;
};

const resolveState = (
  consents: ConsentSummary[],
  transactions: TransactionsResponse,
): DashboardState => {
  if (consents.length === 0) {
    return 'empty';
  }

  if (consents.some((consent) => consent.status === 'processing')) {
    return 'syncing';
  }

  if (transactions.transactions.length === 0) {
    return 'syncing';
  }

  if (consents.some((consent) => consent.lastSyncStatus === 'failed')) {
    return 'stale';
  }

  const lastSyncedAt = mostRecent(consents);

  if (lastSyncedAt === null) {
    return 'syncing';
  }

  const hoursAgo = (Date.now() - new Date(lastSyncedAt).getTime()) / 3_600_000;

  if (hoursAgo > STALE_AFTER_HOURS) {
    return 'stale';
  }

  return 'ready';
};

export const readDashboard = async (query: TransactionQuery): Promise<Dashboard> => {
  try {
    const [consents, accounts, transactions, stats] = await Promise.all([
      api.getConsents(),
      api.getAccounts(),
      api.getTransactions(query),
      api.getStats(),
    ]);

    const failed = consents.consents.find((consent) => consent.lastSyncStatus === 'failed');

    return {
      state: resolveState(consents.consents, transactions),
      consents: consents.consents,
      accounts,
      transactions,
      stats,
      lastSyncedAt: mostRecent(consents.consents),
      syncError: failed?.lastSyncError ?? null,
    };
  } catch {
    return {
      state: 'unreachable',
      consents: [],
      accounts: emptyAccounts,
      transactions: { transactions: [], nextCursor: null },
      stats: emptyStats,
      lastSyncedAt: null,
      syncError: null,
    };
  }
};

export const startLink = async (): Promise<string> => {
  const token = await api.createLinkToken();

  return token.linkToken;
};

export const completeLink = async (publicToken: string): Promise<void> => {
  await api.createConsent(publicToken);
};
