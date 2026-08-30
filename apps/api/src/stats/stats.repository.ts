import { Injectable } from '@nestjs/common';

import { Prisma } from '@coffer/database';

import { DatabaseService } from '../database/database.service';
import type { StatsSnapshot } from '@coffer/database';

export type MonthRow = {
  month: Date;
  inflow: Prisma.Decimal;
  outflow: Prisma.Decimal;
};

@Injectable()
export class StatsRepository {
  constructor(private readonly database: DatabaseService) {}

  latest(userId: string): Promise<StatsSnapshot | null> {
    return this.database.client.statsSnapshot.findFirst({
      where: { userId },
      orderBy: [{ periodStart: 'desc' }, { computedAt: 'desc' }],
    });
  }

  monthlyTotals(userId: string, since: Date): Promise<MonthRow[]> {
    return this.database.client.$queryRaw<MonthRow[]>`
      SELECT date_trunc('month', t."bookedAt")::date AS month,
             COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'in'), 0) AS inflow,
             COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'out'), 0) AS outflow
      FROM transactions t
      JOIN accounts a ON a.id = t."accountId"
      JOIN access_consents c ON c.id = a."accessConsentId"
      WHERE t."removedAt" IS NULL
        AND t."isInternalTransfer" = FALSE
        AND t."bookedAt" >= ${since}
        AND c."userId" = ${userId}::uuid
        AND c.status <> 'revoked'
      GROUP BY 1
      ORDER BY 1
    `;
  }
}
