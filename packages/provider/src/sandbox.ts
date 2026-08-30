import { Products } from 'plaid';

import { plaidClient } from './client';
import type { CustomSandboxTransaction } from 'plaid';

export const SANDBOX_INSTITUTION_ID = 'ins_109508';

const DAYS_REQUESTED = 730;

export type SandboxOverrideTransaction = {
  date_transacted: string;
  date_posted: string;
  amount: number;
  description: string;
  currency: string;
};

export type SandboxOverrideAccount = {
  type: string;
  subtype: string;
  starting_balance: number;
  currency: string;
  meta: { name: string; official_name?: string };
  transactions: SandboxOverrideTransaction[];
};

export type SandboxCustomUser = {
  seed: string;
  override_accounts: SandboxOverrideAccount[];
};

export const createSandboxPublicToken = async (customUser: SandboxCustomUser): Promise<string> => {
  const response = await plaidClient().sandboxPublicTokenCreate({
    institution_id: SANDBOX_INSTITUTION_ID,
    initial_products: [Products.Transactions],
    options: {
      override_username: 'user_custom',
      override_password: JSON.stringify(customUser),
      transactions: { days_requested: DAYS_REQUESTED },
    },
  });

  return response.data.public_token;
};

export const createDynamicSandboxPublicToken = async (): Promise<string> => {
  const response = await plaidClient().sandboxPublicTokenCreate({
    institution_id: SANDBOX_INSTITUTION_ID,
    initial_products: [Products.Transactions],
    options: {
      override_username: 'user_transactions_dynamic',
      override_password: 'pass_good',
      transactions: { days_requested: DAYS_REQUESTED },
    },
  });

  return response.data.public_token;
};

export const createSandboxTransactions = async (
  accessToken: string,
  transactions: CustomSandboxTransaction[],
): Promise<void> => {
  await plaidClient().sandboxTransactionsCreate({ access_token: accessToken, transactions });
};
