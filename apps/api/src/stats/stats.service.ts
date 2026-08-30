import { Injectable } from '@nestjs/common';

import { SEEDED_USER_ID } from '../config/app';

import { MONTHS_CHARTED, fillMonths } from './monthly-series';
import { percentageChange, projectBalance, runwayLabel } from './runway';
import { StatsRepository } from './stats.repository';
import type { MonthlyTotal, StatsResponse } from '@coffer/contracts';

const DEFAULT_CURRENCY = 'GBP';

const startOfMonth = (at: Date): Date =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));

const endOfMonth = (at: Date): Date =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 0));

const chartStart = (at: Date): Date =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() - (MONTHS_CHARTED - 1), 1));

const monthOnMonth = (
  series: MonthlyTotal[],
  read: (total: MonthlyTotal) => string,
): number | null => {
  const current = series[series.length - 1];
  const previous = series[series.length - 2];

  if (current === undefined || previous === undefined) {
    return null;
  }

  return percentageChange(Number(read(current)), Number(read(previous)));
};

@Injectable()
export class StatsService {
  constructor(private readonly stats: StatsRepository) {}

  async read(): Promise<StatsResponse> {
    const snapshot = await this.stats.latest(SEEDED_USER_ID);
    const now = new Date();
    const rows = await this.stats.monthlyTotals(SEEDED_USER_ID, chartStart(now));

    const monthlySeries = fillMonths(
      now,
      rows.map((row) => ({
        month: row.month.toISOString().slice(0, 10),
        inflow: Number(row.inflow),
        outflow: Number(row.outflow),
      })),
    );

    const inflowChangePercent = monthOnMonth(monthlySeries, (total) => total.inflow);
    const outflowChangePercent = monthOnMonth(monthlySeries, (total) => total.outflow);

    if (snapshot === null) {
      return {
        currency: DEFAULT_CURRENCY,
        totalBalance: '0.00',
        monthlyInflow: '0.00',
        monthlyOutflow: '0.00',
        inflowChangePercent,
        outflowChangePercent,
        netBurn: '0.00',
        runwayDays: null,
        runwayLabel: '—',
        cashZeroAt: null,
        periodStart: startOfMonth(now).toISOString().slice(0, 10),
        periodEnd: endOfMonth(now).toISOString().slice(0, 10),
        computedAt: null,
        projection: [],
        monthlySeries,
      };
    }

    const totalBalance = Number(snapshot.totalBalance);
    const netBurn = Number(snapshot.netBurn);

    return {
      currency: DEFAULT_CURRENCY,
      totalBalance: snapshot.totalBalance.toFixed(2),
      monthlyInflow: snapshot.monthlyInflow.toFixed(2),
      monthlyOutflow: snapshot.monthlyOutflow.toFixed(2),
      inflowChangePercent,
      outflowChangePercent,
      netBurn: snapshot.netBurn.toFixed(2),
      runwayDays: snapshot.runwayDays,
      runwayLabel: runwayLabel(snapshot.runwayDays),
      cashZeroAt:
        snapshot.cashZeroAt === null ? null : snapshot.cashZeroAt.toISOString().slice(0, 10),
      periodStart: snapshot.periodStart.toISOString().slice(0, 10),
      periodEnd: snapshot.periodEnd.toISOString().slice(0, 10),
      computedAt: snapshot.computedAt.toISOString(),
      projection: projectBalance(totalBalance, netBurn, snapshot.periodStart),
      monthlySeries,
    };
  }
}
