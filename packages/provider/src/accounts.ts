import { capture } from './capture';
import { plaidClient } from './client';
import { normaliseAccount } from './normalise';
import type { AccountsGetResponse } from 'plaid';
import type { Captured, NormalisedAccount } from './types';

export const parseAccounts = (body: unknown): NormalisedAccount[] => {
  const response = body as AccountsGetResponse;

  return response.accounts.map(normaliseAccount);
};

export const fetchAccounts = async (
  accessToken: string,
): Promise<Captured<NormalisedAccount[]>> => {
  const response = await plaidClient().accountsBalanceGet({ access_token: accessToken });

  return {
    raw: capture('/accounts/balance/get', null, response.data, response.status),
    data: parseAccounts(response.data),
  };
};
