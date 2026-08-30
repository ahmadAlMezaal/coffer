import { monthLabel, monthYearLabel, preciseMoney, signedPercentage } from '@/lib/format';
import type { MonthlyTotal } from '@coffer/contracts';

type FlowCardProps = {
  title: string;
  amount: string;
  currency: string;
  changePercent: number | null;
  series: MonthlyTotal[];
  read: (total: MonthlyTotal) => string;
  goodWhenRising: boolean;
};

const Delta = ({ change, good }: { change: number | null; good: boolean }) => {
  const label = signedPercentage(change);

  if (label === null) {
    return <p className="text-ink-faint mt-1 text-xs">No previous month to compare</p>;
  }

  return (
    <p className={`mt-1 text-xs font-medium ${good ? 'text-inflow' : 'text-outflow'}`}>
      {label} from last month
    </p>
  );
};

export const FlowCard = ({
  title,
  amount,
  currency,
  changePercent,
  series,
  read,
  goodWhenRising,
}: FlowCardProps) => {
  const values = series.map((total) => Number(read(total)));
  const highest = Math.max(...values, 1);
  const good = changePercent === null ? true : goodWhenRising === changePercent >= 0;

  return (
    <section className="card flex flex-col p-5">
      <p className="eyebrow">{title}</p>
      <p className="figure text-ink mt-3 text-3xl font-extrabold">
        {preciseMoney(amount, currency)}
      </p>
      <Delta change={changePercent} good={good} />

      <div className="mt-4 flex h-28 items-end gap-2">
        {series.map((total, index) => {
          const value = values[index] ?? 0;
          const newest = index === series.length - 1;

          return (
            <div key={total.month} className="flex h-full flex-1 flex-col justify-end gap-2">
              <div
                title={`${monthYearLabel(total.month)}: ${preciseMoney(read(total), currency)}`}
                style={{ height: `${Math.max((value / highest) * 100, 2)}%` }}
                className={`rounded-t-[3px] ${newest ? 'bg-plum' : 'bg-plum/25'}`}
              />
              <span className="text-ink-faint text-center text-[0.625rem] font-medium">
                {monthLabel(total.month)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
