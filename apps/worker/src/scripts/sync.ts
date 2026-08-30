import '../config/env';

import { prisma } from '@coffer/database';
import { createSandboxTransactions } from '@coffer/provider';

import { startSync, withTemporalClient } from './temporal-client';

const INJECTION_SETTLE_MS = 8000;

const NEW_SANDBOX_TRANSACTIONS = [
  {
    date_transacted: new Date().toISOString().slice(0, 10),
    date_posted: new Date().toISOString().slice(0, 10),
    amount: 2450.75,
    description: 'Supplier payment, Vellum Print',
    iso_currency_code: 'GBP',
  },
];

const run = async () => {
  const consent = await prisma.accessConsent.findFirst({
    where: { status: { not: 'revoked' } },
    orderBy: { consentedAt: 'desc' },
    select: { id: true, accessToken: true },
  });

  if (!consent) {
    console.warn('No consent to sync. Run make seed first.');

    return;
  }

  if (process.env.COFFER_INJECT_TRANSACTIONS === 'true') {
    await createSandboxTransactions(consent.accessToken, NEW_SANDBOX_TRANSACTIONS);

    console.warn('Injected a new sandbox transaction, it lands only on a make seed-dynamic item');

    await new Promise((resolve) => {
      setTimeout(resolve, INJECTION_SETTLE_MS);
    });
  }

  await withTemporalClient(async (client) => {
    await startSync(client, consent.id);
  });

  await prisma.$disconnect();
};

void run();
