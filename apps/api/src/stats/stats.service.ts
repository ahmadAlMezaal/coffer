import { Injectable } from '@nestjs/common';

import { SEEDED_USER_ID } from '../config/app';

import { MONTHS_CHARTED, comparisonSpan, fillMonths } from './monthly-series';
import { percentageChange, projectBalance, runwayLabel } from './runway';
import { StatsRepository } from './stats.repository';
import type { StatsResponse } from '@coffer/contracts';

const DEFAULT_CURRENCY = 'GBP';

const startOfMonth = (at: Date): Date =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));

const endOfMonth = (at: Date): Date =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 0));

const chartStart = (at: Date): Date =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() - (MONTHS_CHARTED - 1), 1));

@Injectable()
export class StatsService {
  constructor(private readonly stats: StatsRepository) {}

  async read(): Promise<StatsResponse> {
    const snapshot = await this.stats.latest(SEEDED_USER_ID);
    const now = new Date();
    const span = comparisonSpan(now);
    const [rows, previous] = await Promise.all([
      this.stats.monthlyTotals(SEEDED_USER_ID, chartStart(now)),
      this.stats.spanTotals(SEEDED_USER_ID, span.from, span.to),
    ]);

    const monthlySeries = fillMonths(
      now,
      rows.map((row) => ({
        month: row.month.toISOString().slice(0, 10),
        inflow: Number(row.inflow),
        outflow: Number(row.outflow),
      })),
    );

    if (snapshot === null) {
      return {
        currency: DEFAULT_CURRENCY,
        totalBalance: '0.00',
        monthlyInflow: '0.00',
        monthlyOutflow: '0.00',
        inflowChangePercent: null,
        outflowChangePercent: null,
        monthComplete: span.monthComplete,
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
      inflowChangePercent: percentageChange(
        Number(snapshot.monthlyInflow),
        Number(previous.inflow),
      ),
      outflowChangePercent: percentageChange(
        Number(snapshot.monthlyOutflow),
        Number(previous.outflow),
      ),
      monthComplete: span.monthComplete,
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
