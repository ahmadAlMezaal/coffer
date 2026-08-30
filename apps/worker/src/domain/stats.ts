import { monthEnd, monthStart, shiftMonth } from './calendar';

const DAYS_IN_MONTH = 30.4375;

export type MonthTotals = {
  inflow: number;
  outflow: number;
};

export type StatsInput = {
  totalBalance: number;
  currentMonth: MonthTotals;
  trailing: MonthTotals[];
  today: Date;
};

export type ComputedStats = {
  totalBalance: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  netBurn: number;
  runwayDays: number | null;
  cashZeroAt: Date | null;
};

export const monthWindows = (year: number, month: number, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const shifted = shiftMonth(year, month, -(index + 1));

    return {
      start: monthStart(shifted.year, shifted.month),
      end: monthEnd(shifted.year, shifted.month),
    };
  });

const averageNetBurn = (trailing: MonthTotals[], currentMonth: MonthTotals): number => {
  const active = trailing.filter((month) => month.inflow + month.outflow > 0);

  if (active.length === 0) {
    return currentMonth.outflow - currentMonth.inflow;
  }

  const burn = active.reduce((running, month) => running + (month.outflow - month.inflow), 0);

  return burn / active.length;
};

export const computeStats = (input: StatsInput): ComputedStats => {
  const netBurn = averageNetBurn(input.trailing, input.currentMonth);

  if (netBurn <= 0) {
    return {
      totalBalance: input.totalBalance,
      monthlyInflow: input.currentMonth.inflow,
      monthlyOutflow: input.currentMonth.outflow,
      netBurn,
      runwayDays: null,
      cashZeroAt: null,
    };
  }

  const runwayDays = Math.round((input.totalBalance / netBurn) * DAYS_IN_MONTH);

  return {
    totalBalance: input.totalBalance,
    monthlyInflow: input.currentMonth.inflow,
    monthlyOutflow: input.currentMonth.outflow,
    netBurn,
    runwayDays,
    cashZeroAt: new Date(input.today.getTime() + runwayDays * 24 * 60 * 60 * 1000),
  };
};
