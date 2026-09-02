'use client';

import { useState } from 'react';

import {
  monthLabel,
  monthName,
  monthYearLabel,
  percentageChange,
  preciseMoney,
  signedPercentage,
} from '@/lib/format';
import type { MonthlyTotal } from '@coffer/contracts';

type Flow = 'inflow' | 'outflow';

type FlowCardProps = {
  flow: Flow;
  amount: string;
  currency: string;
  changePercent: number | null;
  monthComplete: boolean;
  series: MonthlyTotal[];
};

const SUBJECT: Record<Flow, string> = { inflow: 'income', outflow: 'spend' };

const RISING_IS_GOOD: Record<Flow, boolean> = { inflow: true, outflow: false };

const deltaTone = (change: number, goodWhenRising: boolean): string => {
  if (change === 0) {
    return 'text-ink-faint';
  }

  return goodWhenRising === change > 0 ? 'text-inflow' : 'text-outflow';
};

const Delta = ({
  change,
  goodWhenRising,
  against,
}: {
  change: number | null;
  goodWhenRising: boolean;
  against: string;
}) => {
  const label = signedPercentage(change);

  if (label === null || change === null) {
    return <p className="text-ink-faint mt-1 text-xs">Nothing in {against} to compare with</p>;
  }

  return (
    <p className={`mt-1 text-xs font-medium ${deltaTone(change, goodWhenRising)}`}>
      {label} on {against}
    </p>
  );
};

export const FlowCard = ({
  flow,
  amount,
  currency,
  changePercent,
  monthComplete,
  series,
}: FlowCardProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const values = series.map((total) => Number(total[flow]));
  const highest = Math.max(...values, 1);

  const currentIndex = series.length - 1;
  const selectedIndex = series.findIndex((total) => total.month === selected);
  const showingCurrent = selectedIndex === -1 || selectedIndex === currentIndex;

  const previous = showingCurrent ? null : series[selectedIndex - 1];
  const heading = selectedIndex === -1 ? 'Monthly' : monthName(series[selectedIndex]?.month ?? '');

  const figure = showingCurrent ? amount : (series[selectedIndex]?.[flow] ?? '0.00');

  const change = showingCurrent
    ? changePercent
    : percentageChange(Number(figure), Number(previous?.[flow] ?? 0));

  const against = () => {
    if (showingCurrent) {
      return monthComplete ? 'last month' : 'the same days last month';
    }

    return previous === undefined || previous === null ? '' : monthName(previous.month);
  };

  return (
    <section className="card flex flex-col p-5">
      <p className="eyebrow">
        {heading} {SUBJECT[flow]}
      </p>
      <p className="figure text-ink mt-3 text-3xl font-extrabold">
        {preciseMoney(figure, currency)}
      </p>

      {against() === '' ? (
        <p className="text-ink-faint mt-1 text-xs">No earlier month here to compare with</p>
      ) : (
        <Delta change={change} goodWhenRising={RISING_IS_GOOD[flow]} against={against()} />
      )}

      <div className="mt-4 flex h-28 items-end gap-2">
        {series.map((total, index) => {
          const value = values[index] ?? 0;
          const isSelected = index === selectedIndex;

          return (
            <button
              key={total.month}
              type="button"
              onClick={() => setSelected(isSelected ? null : total.month)}
              aria-pressed={isSelected}
              aria-label={`Show ${monthYearLabel(total.month)} ${SUBJECT[flow]}, ${preciseMoney(total[flow], currency)}`}
              className="group flex h-full flex-1 cursor-pointer flex-col justify-end gap-2 rounded-sm"
            >
              <span
                style={{ height: `${Math.max((value / highest) * 100, 2)}%` }}
                className={`block rounded-t-[3px] transition-colors ${
                  isSelected ? 'bg-plum' : 'bg-plum/25 group-hover:bg-plum/50'
                }`}
              />
              <span
                className={`text-center text-[0.625rem] font-medium ${
                  isSelected ? 'text-plum font-bold' : 'text-ink-faint group-hover:text-ink'
                }`}
              >
                {monthLabel(total.month)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
