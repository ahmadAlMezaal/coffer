import Link from 'next/link';

import { monthLabel, monthYearLabel, preciseMoney, signedPercentage } from '@/lib/format';
import { filtersHref, monthRange } from '@/lib/transactions-query';
import type { MonthlyTotal } from '@coffer/contracts';
import type { TransactionFilters } from '@/lib/transactions-query';

type FlowCardProps = {
  title: string;
  amount: string;
  currency: string;
  changePercent: number | null;
  series: MonthlyTotal[];
  read: (total: MonthlyTotal) => string;
  goodWhenRising: boolean;
  filters: TransactionFilters;
};

const Delta = ({ change, good }: { change: number | null; good: boolean }) => {
  const label = signedPercentage(change);

  if (label === null) {
    return <p className="text-ink-faint mt-1 text-xs">Nothing to compare with last month</p>;
  }

  return (
    <p className={`mt-1 text-xs font-medium ${good ? 'text-inflow' : 'text-outflow'}`}>
      {label} on last month
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
  filters,
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
          const range = monthRange(total.month);
          const selected = filters.from === range.from && filters.to === range.to;
          const value = values[index] ?? 0;

          return (
            <Link
              key={total.month}
              href={filtersHref({ ...filters, from: range.from, to: range.to, page: 1 })}
              scroll={false}
              aria-label={`Show ${monthYearLabel(total.month)} transactions, ${preciseMoney(read(total), currency)}`}
              aria-current={selected ? 'true' : undefined}
              className="group flex h-full flex-1 flex-col justify-end gap-2 rounded-sm"
            >
              <span
                style={{ height: `${Math.max((value / highest) * 100, 2)}%` }}
                className={`block rounded-t-[3px] transition-colors ${
                  selected ? 'bg-plum' : 'bg-plum/25 group-hover:bg-plum/50'
                }`}
              />
              <span
                className={`text-center text-[0.625rem] font-medium ${
                  selected ? 'text-plum font-bold' : 'text-ink-faint group-hover:text-ink'
                }`}
              >
                {monthLabel(total.month)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
