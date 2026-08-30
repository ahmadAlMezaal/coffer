import { relativeTime } from '@/lib/format';
import type { DashboardState } from '@/lib/services/dashboard.service';

type SyncNoticeProps = {
  state: DashboardState;
  lastSyncedAt: string | null;
  syncError: string | null;
  apiError: string | null;
};

const shell = 'rounded-lg border px-3 py-2 text-sm';

export const SyncNotice = ({ state, lastSyncedAt, syncError, apiError }: SyncNoticeProps) => {
  if (state === 'unreachable') {
    return (
      <p className={`${shell} text-outflow border-outflow/20 bg-outflow/5`}>
        The API is not answering on port 3001. Run <code>make dev</code>.
        {apiError === null ? '' : ` The connection failed with: ${apiError}.`}
      </p>
    );
  }

  if (state === 'rejected') {
    return (
      <p className={`${shell} text-outflow border-outflow/20 bg-outflow/5`}>
        The API answered but rejected the request: {apiError}. The dashboard stays empty until that
        clears.
      </p>
    );
  }

  if (state === 'empty') {
    return (
      <p className={`${shell} border-hairline bg-surface text-ink-muted`}>
        Nothing is linked yet. Connect a bank, or run <code>make seed</code> for a sandbox business
        with months of history.
      </p>
    );
  }

  if (state === 'syncing') {
    return (
      <p className={`${shell} text-caution border-caution/20 bg-caution/5`}>
        Balances are in. Transactions are still arriving from the bank, which takes seconds to
        minutes. This page updates on refresh.
      </p>
    );
  }

  if (state === 'stale') {
    return (
      <p className={`${shell} text-caution border-caution/20 bg-caution/5`}>
        {syncError === null
          ? `Showing data from the last successful sync${
              lastSyncedAt === null ? '' : `, ${relativeTime(lastSyncedAt)}`
            }.`
          : `The last sync failed: ${syncError}. Showing the data from the run before it.`}
      </p>
    );
  }

  return (
    <p className="text-ink-muted text-sm">
      Synced {lastSyncedAt === null ? 'just now' : relativeTime(lastSyncedAt)}. The worker polls
      every four hours.
    </p>
  );
};
