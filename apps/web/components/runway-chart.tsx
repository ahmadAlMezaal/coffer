import { money, shortDate } from '@/lib/format';
import type { RunwayPoint } from '@coffer/contracts';

type RunwayChartProps = {
  points: RunwayPoint[];
  currency: string;
  netBurn: string;
};

const WIDTH = 720;
const HEIGHT = 180;

export const RunwayChart = ({ points, currency, netBurn }: RunwayChartProps) => {
  if (points.length < 2) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Projected balance</p>
        <p className="mt-6 text-sm text-neutral-500">
          The curve appears once a sync has computed a burn rate.
        </p>
      </div>
    );
  }

  const highest = Math.max(...points.map((point) => Number(point.balance)));
  const scaleX = (index: number) => (index / (points.length - 1)) * WIDTH;
  const scaleY = (balance: number) => HEIGHT - (balance / (highest || 1)) * (HEIGHT - 12);

  const line = points
    .map(
      (point, index) => `${scaleX(index).toFixed(1)},${scaleY(Number(point.balance)).toFixed(1)}`,
    )
    .join(' ');

  const last = points[points.length - 1];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Projected balance</p>
        <p className="text-xs text-neutral-500">
          Straight line projection at {money(netBurn, currency)} net burn a month, not balance
          history
        </p>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-3 h-44 w-full"
        role="img"
        aria-label="Projected balance falling at the current net burn rate"
      >
        <polygon points={`0,${HEIGHT} ${line} ${WIDTH},${HEIGHT}`} fill="rgb(16 185 129 / 0.12)" />
        <polyline points={line} fill="none" stroke="rgb(16 185 129)" strokeWidth="2" />
      </svg>

      <div className="mt-2 flex justify-between text-xs text-neutral-500">
        <span>{shortDate(points[0]?.date ?? '')}</span>
        <span>{last ? shortDate(last.date) : ''}</span>
      </div>
    </div>
  );
};
