import { relativeTime } from '@/lib/format';
import type { DashboardState } from '@/lib/services/dashboard.service';

type SyncNoticeProps = {
  state: DashboardState;
  lastSyncedAt: string | null;
  syncError: string | null;
};

const shell = 'rounded-xl border px-4 py-3 text-sm';

export const SyncNotice = ({ state, lastSyncedAt, syncError }: SyncNoticeProps) => {
  if (state === 'unreachable') {
    return (
      <p className={`${shell} border-red-200 bg-red-50 text-red-700`}>
        The API is not answering on port 3001. Run <code>make dev</code>.
      </p>
    );
  }

  if (state === 'empty') {
    return (
      <p className={`${shell} border-neutral-200 bg-white text-neutral-600`}>
        Nothing is linked yet. Connect a bank, or run <code>make seed</code> for a sandbox business
        with six months of history.
      </p>
    );
  }

  if (state === 'syncing') {
    return (
      <p className={`${shell} border-amber-200 bg-amber-50 text-amber-800`}>
        Balances are in. Transactions are still being fetched from the bank, which takes seconds to
        minutes. This page updates on refresh.
      </p>
    );
  }

  if (state === 'stale') {
    return (
      <p className={`${shell} border-amber-200 bg-amber-50 text-amber-800`}>
        {syncError
          ? `The last sync failed: ${syncError}. Showing the data from the run before it.`
          : `Showing data from the last successful sync${
              lastSyncedAt ? `, ${relativeTime(lastSyncedAt)}` : ''
            }.`}
      </p>
    );
  }

  return (
    <p className="text-sm text-neutral-500">
      Synced {lastSyncedAt ? relativeTime(lastSyncedAt) : 'just now'}. The worker polls every four
      hours.
    </p>
  );
};
