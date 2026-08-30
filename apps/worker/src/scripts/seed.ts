import '../config/env';

import { prisma } from '@coffer/database';
import { createDynamicSandboxPublicToken, createSandboxPublicToken } from '@coffer/provider';

import { linkPublicToken } from './link';
import { businessSandboxUser } from './sandbox-business';
import { startSync, withTemporalClient } from './temporal-client';

const dynamicSandbox = process.env.COFFER_SANDBOX_USER === 'dynamic';

const publicToken = async (): Promise<string> => {
  if (dynamicSandbox) {
    return createDynamicSandboxPublicToken();
  }

  return createSandboxPublicToken(businessSandboxUser(new Date()));
};

const run = async () => {
  const consentId = await linkPublicToken(await publicToken());

  console.warn(
    dynamicSandbox
      ? `Seeded consent ${consentId} from the dynamic sandbox user, so make sync-new can inject`
      : `Seeded consent ${consentId} from the custom business sandbox user`,
  );

  await withTemporalClient(async (client) => {
    await startSync(client, consentId);
  });

  await prisma.$disconnect();
};

void run();
