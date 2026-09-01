import '../config/env';

import { prisma } from '@coffer/database';

import { withTemporalClient } from './temporal-client';
import type { Client } from '@temporalio/client';

const terminateSync = async (client: Client, consentId: string): Promise<void> => {
  try {
    await client.workflow.getHandle(`sync-${consentId}`).terminate('the database was reset');

    console.warn(`Terminated sync-${consentId}`);
  } catch {
    console.warn(`sync-${consentId} was not running, nothing to terminate`);
  }
};

const run = async () => {
  const consents = await prisma.accessConsent.findMany({ select: { id: true } });

  await withTemporalClient(async (client) => {
    for (const consent of consents) {
      await terminateSync(client, consent.id);
    }
  });

  await prisma.rawProviderPayload.deleteMany();
  await prisma.syncRun.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.statsSnapshot.deleteMany();
  await prisma.accessConsent.deleteMany();

  console.warn(`Cleared ${consents.length} consent(s) and everything hanging off them.`);

  await prisma.$disconnect();
};

void run();
