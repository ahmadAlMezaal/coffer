import { Configuration, PlaidApi } from 'plaid';

import { readProviderConfig } from './config';

let cached: PlaidApi | null = null;

export const plaidClient = (): PlaidApi => {
  if (cached) {
    return cached;
  }

  const { clientId, secret, basePath } = readProviderConfig();

  cached = new PlaidApi(
    new Configuration({
      basePath,
      baseOptions: {
        headers: { 'PLAID-CLIENT-ID': clientId, 'PLAID-SECRET': secret },
        timeout: 30_000,
      },
    }),
  );

  return cached;
};
