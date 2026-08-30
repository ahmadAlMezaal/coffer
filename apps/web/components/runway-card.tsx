import { money, shortDate } from '@/lib/format';
import type { RunwayPoint } from '@coffer/contracts';

type RunwayCardProps = {
  points: RunwayPoint[];
  currency: string;
  netBurn: string;
  runwayLabel: string;
  cashZeroAt: string | null;
};

const WIDTH = 320;
const HEIGHT = 108;
const TOP = 8;
const INSET = 4;

const NODES = 7;

export const RunwayCard = ({
  points,
  currency,
  netBurn,
  runwayLabel,
  cashZeroAt,
}: RunwayCardProps) => {
  const balances = points.map((point) => Number(point.balance));
  const highest = Math.max(...balances, 1);
  const lastIndex = points.length - 1;

  const scaleX = (index: number) =>
    INSET + (lastIndex === 0 ? 0 : (index / lastIndex) * (WIDTH - INSET * 2));
  const scaleY = (balance: number) => HEIGHT - (balance / highest) * (HEIGHT - TOP);

  const line = points
    .map(
      (point, index) => `${scaleX(index).toFixed(1)},${scaleY(Number(point.balance)).toFixed(1)}`,
    )
    .join(' ');

  const step = Math.max(1, Math.round(lastIndex / (NODES - 1)));

  const nodes = points
    .map((point, index) => ({ point, index }))
    .filter((entry) => entry.index % step === 0 || entry.index === lastIndex);

  return (
    <section className="card flex flex-col p-5">
      <p className="eyebrow">Runway and cash zero</p>

      {points.length < 2 ? (
        <div className="flex flex-1 flex-col justify-center py-8">
          <p className="text-ink-muted text-sm">
            The curve appears once a sync has computed a burn rate.
          </p>
        </div>
      ) : (
        <>
          <p className="figure text-plum mt-3 text-3xl font-extrabold">{runwayLabel}</p>
          <p className="text-ink-muted mt-1 text-xs">
            {cashZeroAt === null
              ? 'Not burning cash over the last three months'
              : `Cash zero on ${shortDate(cashZeroAt)}`}
          </p>

          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="mt-4 aspect-[320/108] w-full"
            role="img"
            aria-label={`Projected balance falling to zero at ${money(netBurn, currency)} net burn a month`}
          >
            <defs>
              <linearGradient id="runwayFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-plum)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--color-plum)" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            <polygon
              points={`${INSET},${HEIGHT} ${line} ${WIDTH - INSET},${HEIGHT}`}
              fill="url(#runwayFill)"
            />
            <polyline
              points={line}
              fill="none"
              stroke="var(--color-plum)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />

            {nodes.map((entry) => (
              <circle
                key={entry.point.date}
                cx={scaleX(entry.index)}
                cy={scaleY(Number(entry.point.balance))}
                r="3"
                fill="var(--color-surface)"
                stroke="var(--color-plum)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="text-ink-faint mt-2 flex justify-between text-[0.6875rem]">
            <span>{shortDate(points[0]?.date ?? '')}</span>
            <span>at {money(netBurn, currency)} a month</span>
            <span>{shortDate(points[lastIndex]?.date ?? '')}</span>
          </div>
        </>
      )}
    </section>
  );
};
