import { CountryCode, Products } from 'plaid';

import { capture } from './capture';
import { plaidClient } from './client';
import type { Captured, Institution, LinkToken, LinkedItem } from './types';

const DAYS_REQUESTED = 730;

export const createLinkToken = async (userId: string): Promise<LinkToken> => {
  const response = await plaidClient().linkTokenCreate({
    client_name: 'Coffer',
    language: 'en',
    country_codes: [CountryCode.Gb, CountryCode.Us],
    user: { client_user_id: userId },
    products: [Products.Transactions],
    transactions: { days_requested: DAYS_REQUESTED },
  });

  return {
    linkToken: response.data.link_token,
    expiresAt: response.data.expiration,
  };
};

export const exchangePublicToken = async (publicToken: string): Promise<Captured<LinkedItem>> => {
  const response = await plaidClient().itemPublicTokenExchange({ public_token: publicToken });
  const item = await plaidClient().itemGet({ access_token: response.data.access_token });

  return {
    raw: capture('/item/public_token/exchange', null, { item: item.data.item }, response.status),
    data: {
      accessToken: response.data.access_token,
      providerItemId: response.data.item_id,
      institutionId: item.data.item.institution_id ?? null,
      consentExpiresAt: item.data.item.consent_expiration_time ?? null,
    },
  };
};

export const fetchInstitution = async (institutionId: string): Promise<Institution> => {
  const response = await plaidClient().institutionsGetById({
    institution_id: institutionId,
    country_codes: [CountryCode.Gb, CountryCode.Us],
    options: { include_optional_metadata: true },
  });

  const institution = response.data.institution;

  return {
    name: institution.name,
    logo: institution.logo ?? null,
    colour: institution.primary_color ?? null,
  };
};

export const removeItem = async (accessToken: string): Promise<void> => {
  await plaidClient().itemRemove({ access_token: accessToken });
};
