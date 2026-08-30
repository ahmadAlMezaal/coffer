import '../config/env';

import { prisma } from '@coffer/database';
import { createSandboxPublicToken } from '@coffer/provider';

import { linkPublicToken } from './link';
import { businessSandboxUser } from './sandbox-business';
import { startSync, withTemporalClient } from './temporal-client';

const run = async () => {
  const publicToken = await createSandboxPublicToken(businessSandboxUser(new Date()));
  const consentId = await linkPublicToken(publicToken);

  console.warn(`Seeded consent ${consentId}`);

  await withTemporalClient(async (client) => {
    await startSync(client, consentId);
  });

  await prisma.$disconnect();
};

void run();
