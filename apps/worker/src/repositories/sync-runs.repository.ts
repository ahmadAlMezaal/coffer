import { prisma } from '@coffer/database';
import type { SyncRunStatus } from '@coffer/database';

export const start = async (accessConsentId: string, workflowId: string): Promise<string> => {
  const run = await prisma.syncRun.create({
    data: { accessConsentId, workflowId },
    select: { id: true },
  });

  return run.id;
};

export const finish = async (input: {
  syncRunId: string;
  status: SyncRunStatus;
  added: number;
  modified: number;
  removed: number;
  error: string | null;
  finishedAt: Date;
}): Promise<void> => {
  await prisma.syncRun.update({
    where: { id: input.syncRunId },
    data: {
      status: input.status,
      transactionsAdded: input.added,
      transactionsModified: input.modified,
      transactionsRemoved: input.removed,
      error: input.error,
      finishedAt: input.finishedAt,
    },
  });
};
