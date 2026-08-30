import { capture } from './capture';
import { plaidClient } from './client';
import { normaliseAccount, normaliseTransaction } from './normalise';
import type { TransactionsSyncResponse } from 'plaid';
import type { Captured, PageCounts, TransactionsPage } from './types';

const PAGE_SIZE = 250;

export const parseTransactionsPage = (body: unknown): TransactionsPage => {
  const response = body as TransactionsSyncResponse;

  return {
    accounts: response.accounts.map(normaliseAccount),
    added: response.added.map(normaliseTransaction),
    modified: response.modified.map(normaliseTransaction),
    removed: response.removed.map((entry) => ({ providerTransactionId: entry.transaction_id })),
    nextCursor: response.next_cursor,
    hasMore: response.has_more,
  };
};

export const fetchTransactionsPage = async (
  accessToken: string,
  cursor: string | null,
): Promise<Captured<PageCounts>> => {
  const response = await plaidClient().transactionsSync({
    access_token: accessToken,
    cursor: cursor ?? undefined,
    count: PAGE_SIZE,
    options: { include_personal_finance_category: true },
  });

  return {
    raw: capture('/transactions/sync', cursor, response.data, response.status),
    data: {
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
      added: response.data.added.length,
      modified: response.data.modified.length,
      removed: response.data.removed.length,
    },
  };
};
