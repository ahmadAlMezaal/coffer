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
        Coffer cannot reach its own API on port 3001. Run <code>make dev</code>.
        {apiError === null ? '' : ` The connection failed with: ${apiError}.`}
      </p>
    );
  }

  if (state === 'rejected') {
    return (
      <p className={`${shell} text-outflow border-outflow/20 bg-outflow/5`}>
        The API turned the request down: {apiError}. Nothing loads until that clears.
      </p>
    );
  }

  if (state === 'empty') {
    return (
      <p className={`${shell} border-hairline bg-surface text-ink-muted`}>
        No banks connected yet. Connect one to see your balances, spending and runway.
      </p>
    );
  }

  if (state === 'syncing') {
    return <p className="text-ink-muted text-sm">Bringing your latest position in.</p>;
  }

  if (state === 'stale') {
    return (
      <p className={`${shell} text-caution border-caution/20 bg-caution/5`}>
        {syncError === null
          ? `This is your position as of ${lastSyncedAt === null ? 'the last update' : relativeTime(lastSyncedAt)}. We are still trying your bank.`
          : 'We could not reach your bank on the last try, so this is your last known position. We will keep trying.'}
      </p>
    );
  }

  return (
    <p className="text-ink-muted text-sm">
      Up to date as of {lastSyncedAt === null ? 'just now' : relativeTime(lastSyncedAt)}.
    </p>
  );
};
