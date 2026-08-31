import type { Institution } from './consents';

export type TransactionDirection = 'in' | 'out';

export type TransactionSummary = {
  id: string;
  accountId: string;
  accountName: string;
  institution: Institution;
  amount: string;
  direction: TransactionDirection;
  currency: string;
  bookedAt: string;
  description: string;
  merchantName: string | null;
  category: string | null;
  paymentMethod: string | null;
  isInternalTransfer: boolean;
};

export type TransactionQuery = {
  accountId?: string;
  category?: string;
  from?: string;
  to?: string;
  counterparty?: string;
  offset?: number;
  limit?: number;
};

export type TransactionsResponse = {
  transactions: TransactionSummary[];
  total: number;
  offset: number;
  limit: number;
};

export type TransactionCategoriesResponse = {
  categories: string[];
};
