import { STALE_AFTER_HOURS } from '../config';
import * as api from '../repositories/coffer-api.repository';
import type {
  AccountsResponse,
  ConsentSummary,
  StatsResponse,
  TransactionQuery,
  TransactionsResponse,
  UserResponse,
} from '@coffer/contracts';

export type DashboardState = 'empty' | 'syncing' | 'ready' | 'stale' | 'unreachable' | 'rejected';

export type Dashboard = {
  state: DashboardState;
  consents: ConsentSummary[];
  accounts: AccountsResponse;
  transactions: TransactionsResponse;
  categories: string[];
  stats: StatsResponse;
  lastSyncedAt: string | null;
  syncError: string | null;
  apiError: string | null;
};

export type LinkedBanks = {
  state: DashboardState;
  consents: ConsentSummary[];
  accounts: AccountsResponse;
  apiError: string | null;
};

export type Failure = {
  state: Extract<DashboardState, 'unreachable' | 'rejected'>;
  apiError: string;
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
  monthlySeries: [],
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

export const resolveState = (consents: ConsentSummary[], now: Date): DashboardState => {
  if (consents.length === 0) {
    return 'empty';
  }

  if (consents.some((consent) => consent.status === 'processing')) {
    return 'syncing';
  }

  const lastSyncedAt = mostRecent(consents);

  if (lastSyncedAt === null) {
    return 'syncing';
  }

  if (consents.some((consent) => consent.lastSyncStatus === 'failed')) {
    return 'stale';
  }

  const hoursAgo = (now.getTime() - new Date(lastSyncedAt).getTime()) / 3_600_000;

  if (hoursAgo > STALE_AFTER_HOURS) {
    return 'stale';
  }

  return 'ready';
};

export const classifyFailure = (error: unknown): Failure => {
  if (error instanceof api.ApiError) {
    return { state: error.kind, apiError: error.message };
  }

  if (error instanceof Error) {
    return { state: 'unreachable', apiError: error.message };
  }

  return { state: 'unreachable', apiError: 'The dashboard could not be read.' };
};

export const readDashboard = async (query: TransactionQuery): Promise<Dashboard> => {
  try {
    const [consents, accounts, transactions, categories, stats] = await Promise.all([
      api.getConsents(),
      api.getAccounts(),
      api.getTransactions(query),
      api.getTransactionCategories(),
      api.getStats(),
    ]);

    const failed = consents.consents.find((consent) => consent.lastSyncStatus === 'failed');

    return {
      state: resolveState(consents.consents, new Date()),
      consents: consents.consents,
      accounts,
      transactions,
      categories: categories.categories,
      stats,
      lastSyncedAt: mostRecent(consents.consents),
      syncError: failed?.lastSyncError ?? null,
      apiError: null,
    };
  } catch (error) {
    const failure = classifyFailure(error);

    return {
      state: failure.state,
      consents: [],
      accounts: emptyAccounts,
      transactions: { transactions: [], total: 0, offset: 0, limit: query.limit ?? 0 },
      categories: [],
      stats: emptyStats,
      lastSyncedAt: null,
      syncError: null,
      apiError: failure.apiError,
    };
  }
};

export const readLinkedBanks = async (): Promise<LinkedBanks> => {
  try {
    const [consents, accounts] = await Promise.all([api.getConsents(), api.getAccounts()]);

    return {
      state: consents.consents.length === 0 ? 'empty' : 'ready',
      consents: consents.consents,
      accounts,
      apiError: null,
    };
  } catch (error) {
    const failure = classifyFailure(error);

    return {
      state: failure.state,
      consents: [],
      accounts: emptyAccounts,
      apiError: failure.apiError,
    };
  }
};

export const readUser = async (): Promise<UserResponse | null> => {
  try {
    return await api.getUser();
  } catch {
    return null;
  }
};

export const disconnectBank = async (consentId: string): Promise<void> => {
  await api.deleteConsent(consentId);
};

export const startLink = async (): Promise<string> => {
  const token = await api.createLinkToken();

  return token.linkToken;
};

export const completeLink = async (publicToken: string): Promise<void> => {
  await api.createConsent(publicToken);
};
