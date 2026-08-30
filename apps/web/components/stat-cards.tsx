import { preciseMoney, shortDate, signedPercentage } from '@/lib/format';
import type { StatsResponse } from '@coffer/contracts';

type StatCardsProps = {
  stats: StatsResponse;
};

type DeltaProps = {
  change: number | null;
  inverted: boolean;
};

const Delta = ({ change, inverted }: DeltaProps) => {
  const label = signedPercentage(change);

  if (label === null || change === null) {
    return <span className="text-xs text-neutral-400">no previous month</span>;
  }

  const good = inverted ? change <= 0 : change >= 0;

  return (
    <span className={`text-xs font-medium ${good ? 'text-emerald-600' : 'text-red-600'}`}>
      {label} from last month
    </span>
  );
};

export const StatCards = ({ stats }: StatCardsProps) => (
  <div className="grid gap-3 md:grid-cols-3">
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Money in this month</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">
        {preciseMoney(stats.monthlyInflow, stats.currency)}
      </p>
      <Delta change={stats.inflowChangePercent} inverted={false} />
    </div>

    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Money out this month</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">
        {preciseMoney(stats.monthlyOutflow, stats.currency)}
      </p>
      <Delta change={stats.outflowChangePercent} inverted />
    </div>

    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Runway</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">
        {stats.runwayLabel}
      </p>
      <p className="text-xs text-neutral-500">
        {stats.cashZeroAt
          ? `Cash zero on ${shortDate(stats.cashZeroAt)}`
          : 'Not burning cash on the last three months'}
      </p>
    </div>
  </div>
);
