import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type { StatsSnapshot } from '@coffer/database';

@Injectable()
export class StatsRepository {
  constructor(private readonly database: DatabaseService) {}

  latest(userId: string): Promise<StatsSnapshot | null> {
    return this.database.client.statsSnapshot.findFirst({
      where: { userId },
      orderBy: [{ periodStart: 'desc' }, { computedAt: 'desc' }],
    });
  }

  latestBefore(userId: string, periodStart: Date): Promise<StatsSnapshot | null> {
    return this.database.client.statsSnapshot.findFirst({
      where: { userId, periodStart: { lt: periodStart } },
      orderBy: [{ periodStart: 'desc' }, { computedAt: 'desc' }],
    });
  }
}
