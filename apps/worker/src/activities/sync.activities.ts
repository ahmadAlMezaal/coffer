import { fetchAccounts, fetchTransactionsPage, parseTransactionsPage } from '@coffer/provider';

import * as accounts from '../repositories/accounts.repository';
import * as consents from '../repositories/consents.repository';
import * as rawPayloads from '../repositories/raw-payloads.repository';
import * as syncRuns from '../repositories/sync-runs.repository';
import * as transactions from '../repositories/transactions.repository';
import type { SyncRunStatus } from '@coffer/database';

export type StartedRun = {
  syncRunId: string;
  cursor: string | null;
};

export type FetchedPage = {
  rawPayloadId: string;
  nextCursor: string;
  hasMore: boolean;
  historyComplete: boolean;
};

export type AppliedPage = {
  added: number;
  modified: number;
  removed: number;
};

export const startSyncRun = async (input: {
  consentId: string;
  workflowId: string;
}): Promise<StartedRun> => {
  const consent = await consents.findForSync(input.consentId);
  const syncRunId = await syncRuns.start(consent.id, input.workflowId);

  return { syncRunId, cursor: consent.syncCursor };
};

export const fetchPage = async (input: {
  consentId: string;
  syncRunId: string;
  cursor: string | null;
}): Promise<FetchedPage> => {
  const consent = await consents.findForSync(input.consentId);
  const captured = await fetchTransactionsPage(consent.accessToken, input.cursor);
  const rawPayloadId = await rawPayloads.write(consent.id, input.syncRunId, captured.raw);

  return {
    rawPayloadId,
    nextCursor: captured.data.nextCursor,
    hasMore: captured.data.hasMore,
    historyComplete: captured.data.historyComplete,
  };
};

export const normaliseAndUpsertPage = async (input: {
  consentId: string;
  rawPayloadId: string;
}): Promise<AppliedPage> => {
  const body = await rawPayloads.readBody(input.rawPayloadId);
  const page = parseTransactionsPage(body);

  await accounts.upsertMany(input.consentId, page.accounts, new Date());

  const accountIds = await accounts.idsByProviderAccountId(input.consentId);

  const added = await transactions.upsertAdded(page.added, accountIds);
  const modified = await transactions.applyModified(page.modified);
  const removed = await transactions.applyRemoved(page.removed, new Date());

  return { added, modified, removed };
};

export const persistCursor = async (input: {
  consentId: string;
  cursor: string;
}): Promise<void> => {
  await consents.persistCursor(input.consentId, input.cursor);
};

export const refreshBalances = async (input: {
  consentId: string;
  syncRunId: string;
}): Promise<void> => {
  const consent = await consents.findForSync(input.consentId);
  const captured = await fetchAccounts(consent.accessToken);

  await rawPayloads.write(consent.id, input.syncRunId, captured.raw);
  await accounts.upsertMany(consent.id, captured.data, new Date());
  await consents.markSynced(consent.id, new Date());
};

export const finishSyncRun = async (input: {
  syncRunId: string;
  status: SyncRunStatus;
  added: number;
  modified: number;
  removed: number;
  error: string | null;
}): Promise<void> => {
  await syncRuns.finish({ ...input, finishedAt: new Date() });
};
