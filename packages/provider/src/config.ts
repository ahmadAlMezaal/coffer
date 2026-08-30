import { PlaidEnvironments } from 'plaid';

export const DEFAULT_CURRENCY = 'GBP';

export const PROVIDER_NAME = 'plaid';

const requireEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not set. Copy .env.example to .env and fill in your Plaid keys.`);
  }

  return value;
};

export const readProviderConfig = () => {
  const environment = process.env.PLAID_ENV ?? 'sandbox';
  const basePath = PlaidEnvironments[environment];

  if (!basePath) {
    throw new Error(`PLAID_ENV "${environment}" is not a Plaid environment.`);
  }

  return {
    clientId: requireEnv('PLAID_CLIENT_ID'),
    secret: requireEnv('PLAID_SECRET'),
    environment,
    basePath,
  };
};
