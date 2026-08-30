import * as workflow from '@temporalio/workflow';
import type * as activities from './activities';

const {
  detectInternalTransfers,
  fetchPage,
  finishSyncRun,
  normaliseAndUpsertPage,
  persistCursor,
  recomputeStats,
  refreshBalances,
  startSyncRun,
} = workflow.proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { initialInterval: '5 seconds', backoffCoefficient: 2, maximumAttempts: 5 },
});

export const syncNowSignal = workflow.defineSignal('syncNow');

export type SyncConsentInput = {
  consentId: string;
  iteration?: number;
};

const SYNC_INTERVAL = '4 hours';
const ITERATIONS_BEFORE_CONTINUE_AS_NEW = 30;
const MAX_PAGES_PER_RUN = 200;

export const syncConsentWorkflow = async (input: SyncConsentInput): Promise<void> => {
  let syncRequested = false;

  workflow.setHandler(syncNowSignal, () => {
    syncRequested = true;
  });

  let iteration = input.iteration ?? 0;

  while (iteration < ITERATIONS_BEFORE_CONTINUE_AS_NEW) {
    const run = await startSyncRun({
      consentId: input.consentId,
      workflowId: workflow.workflowInfo().workflowId,
    });

    let added = 0;
    let modified = 0;
    let removed = 0;

    try {
      let cursor = run.cursor;
      let pages = 0;

      for (;;) {
        const page = await fetchPage({
          consentId: input.consentId,
          syncRunId: run.syncRunId,
          cursor,
        });

        const applied = await normaliseAndUpsertPage({
          consentId: input.consentId,
          rawPayloadId: page.rawPayloadId,
        });

        added += applied.added;
        modified += applied.modified;
        removed += applied.removed;
        cursor = page.nextCursor;
        pages += 1;

        if (!page.hasMore || pages >= MAX_PAGES_PER_RUN) {
          break;
        }
      }

      await persistCursor({ consentId: input.consentId, cursor });
      await refreshBalances({ consentId: input.consentId, syncRunId: run.syncRunId });
      await detectInternalTransfers({ consentId: input.consentId });
      await recomputeStats({ consentId: input.consentId });

      await finishSyncRun({
        syncRunId: run.syncRunId,
        status: 'succeeded',
        added,
        modified,
        removed,
        error: null,
      });
    } catch (error) {
      await finishSyncRun({
        syncRunId: run.syncRunId,
        status: 'failed',
        added,
        modified,
        removed,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    iteration += 1;

    syncRequested = false;
    await workflow.condition(() => syncRequested, SYNC_INTERVAL);
  }

  await workflow.continueAsNew<typeof syncConsentWorkflow>({
    consentId: input.consentId,
    iteration: 0,
  });
};
