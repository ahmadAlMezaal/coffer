import '../config/env';

import { prisma } from '@coffer/database';
import { parseAccounts, parseTransactionsPage } from '@coffer/provider';

import { recomputeStats } from '../activities/analysis.activities';
import * as accounts from '../repositories/accounts.repository';
import * as rawPayloads from '../repositories/raw-payloads.repository';
import * as transactions from '../repositories/transactions.repository';

const replayConsent = async (consentId: string): Promise<void> => {
  const balancePages = await rawPayloads.listForConsent(consentId, '/accounts/balance/get');

  for (const payload of balancePages) {
    await accounts.upsertMany(consentId, parseAccounts(payload.responseBody), new Date());
  }

  const syncPages = await rawPayloads.listForConsent(consentId, '/transactions/sync');

  let added = 0;
  let modified = 0;
  let removed = 0;

  for (const payload of syncPages) {
    const page = parseTransactionsPage(payload.responseBody);

    await accounts.upsertMany(consentId, page.accounts, new Date());

    const accountIds = await accounts.idsByProviderAccountId(consentId);

    added += await transactions.upsertAdded(page.added, accountIds);
    modified += await transactions.applyModified(page.modified);
    removed += await transactions.applyRemoved(page.removed, new Date());
  }

  console.warn(
    `Replayed ${syncPages.length} pages for ${consentId}: ${added} added, ${modified} modified, ${removed} removed`,
  );

  await recomputeStats({ consentId });
};

const run = async () => {
  const consents = await prisma.accessConsent.findMany({
    where: { status: { not: 'revoked' } },
    select: { id: true },
  });

  if (consents.length === 0) {
    console.warn('No consents to replay. Run make seed first.');

    return;
  }

  for (const consent of consents) {
    await replayConsent(consent.id);
  }

  await prisma.$disconnect();
};

void run();
