export type ProviderName = 'plaid';

export type Direction = 'in' | 'out';

export type RawCapture = {
  endpoint: string;
  requestCursor: string | null;
  responseBody: unknown;
  responseHash: string;
  httpStatus: number;
};

export type Captured<T> = {
  raw: RawCapture;
  data: T;
};

export type NormalisedAccount = {
  providerAccountId: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
  currency: string;
  currentBalance: string;
  availableBalance: string | null;
};

export type NormalisedTransaction = {
  providerTransactionId: string;
  providerAccountId: string;
  amount: string;
  direction: Direction;
  currency: string;
  bookedAt: string;
  description: string;
  merchantName: string | null;
  category: string | null;
  paymentMethod: string | null;
  pending: boolean;
};

export type RemovedTransactionRef = {
  providerTransactionId: string;
};

export type TransactionsPage = {
  accounts: NormalisedAccount[];
  added: NormalisedTransaction[];
  modified: NormalisedTransaction[];
  removed: RemovedTransactionRef[];
  nextCursor: string;
  hasMore: boolean;
};

export type PageCounts = {
  nextCursor: string;
  hasMore: boolean;
  historyComplete: boolean;
  added: number;
  modified: number;
  removed: number;
};

export type LinkedItem = {
  accessToken: string;
  providerItemId: string;
  institutionId: string | null;
};

export type LinkToken = {
  linkToken: string;
  expiresAt: string;
};
