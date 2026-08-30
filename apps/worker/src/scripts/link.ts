import { prisma } from '@coffer/database';
import { exchangePublicToken, fetchAccounts, fetchInstitutionName } from '@coffer/provider';

import { SEEDED_USER_EMAIL, SEEDED_USER_ID } from '../config/app';
import * as accounts from '../repositories/accounts.repository';
import * as rawPayloads from '../repositories/raw-payloads.repository';

export const linkPublicToken = async (publicToken: string): Promise<string> => {
  await prisma.user.upsert({
    where: { id: SEEDED_USER_ID },
    create: { id: SEEDED_USER_ID, email: SEEDED_USER_EMAIL },
    update: {},
  });

  const exchanged = await exchangePublicToken(publicToken);
  const institutionName = exchanged.data.institutionId
    ? await fetchInstitutionName(exchanged.data.institutionId)
    : null;

  const consent = await prisma.accessConsent.upsert({
    where: { providerItemId: exchanged.data.providerItemId },
    create: {
      userId: SEEDED_USER_ID,
      providerItemId: exchanged.data.providerItemId,
      accessToken: exchanged.data.accessToken,
      institutionId: exchanged.data.institutionId,
      institutionName,
      status: 'processing',
    },
    update: {
      accessToken: exchanged.data.accessToken,
      institutionName,
      status: 'processing',
    },
  });

  await rawPayloads.write(consent.id, null, exchanged.raw);

  const fetched = await fetchAccounts(exchanged.data.accessToken);

  await rawPayloads.write(consent.id, null, fetched.raw);
  await accounts.upsertMany(consent.id, fetched.data, new Date());

  return consent.id;
};
