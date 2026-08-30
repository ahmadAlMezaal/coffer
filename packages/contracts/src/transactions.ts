export type TransactionDirection = 'in' | 'out';

export type TransactionSummary = {
  id: string;
  accountId: string;
  accountName: string;
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
  from?: string;
  to?: string;
  counterparty?: string;
  cursor?: string;
  limit?: number;
};

export type TransactionsResponse = {
  transactions: TransactionSummary[];
  nextCursor: string | null;
};
