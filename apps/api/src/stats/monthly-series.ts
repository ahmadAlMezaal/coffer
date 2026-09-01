import type { MonthlyTotal } from '@coffer/contracts';

export const MONTHS_CHARTED = 6;

export type MonthTotals = {
  month: string;
  inflow: number;
  outflow: number;
};

export const chartedMonths = (until: Date): string[] =>
  Array.from({ length: MONTHS_CHARTED }, (_, index) =>
    new Date(
      Date.UTC(until.getUTCFullYear(), until.getUTCMonth() - (MONTHS_CHARTED - 1 - index), 1),
    )
      .toISOString()
      .slice(0, 10),
  );

export const fillMonths = (until: Date, totals: MonthTotals[]): MonthlyTotal[] =>
  chartedMonths(until).map((month) => {
    const match = totals.find((total) => total.month === month);

    return {
      month,
      inflow: (match?.inflow ?? 0).toFixed(2),
      outflow: (match?.outflow ?? 0).toFixed(2),
    };
  });

export type ComparisonSpan = {
  from: Date;
  to: Date;
  monthComplete: boolean;
};

export const comparisonSpan = (now: Date): ComparisonSpan => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const dayOfMonth = now.getUTCDate();
  const lastDayOfPreviousMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDayOfThisMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    to: new Date(Date.UTC(year, month - 1, Math.min(dayOfMonth, lastDayOfPreviousMonth))),
    monthComplete: dayOfMonth >= lastDayOfThisMonth,
  };
};
