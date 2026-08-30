import { Injectable } from '@nestjs/common';

import {
  createLinkToken,
  exchangePublicToken,
  fetchAccounts,
  fetchInstitution,
  removeItem,
} from '@coffer/provider';
import type {
  Captured,
  Institution,
  LinkToken,
  LinkedItem,
  NormalisedAccount,
} from '@coffer/provider';

@Injectable()
export class ProviderService {
  createLinkToken(userId: string): Promise<LinkToken> {
    return createLinkToken(userId);
  }

  exchangePublicToken(publicToken: string): Promise<Captured<LinkedItem>> {
    return exchangePublicToken(publicToken);
  }

  fetchAccounts(accessToken: string): Promise<Captured<NormalisedAccount[]>> {
    return fetchAccounts(accessToken);
  }

  fetchInstitution(institutionId: string): Promise<Institution> {
    return fetchInstitution(institutionId);
  }

  removeItem(accessToken: string): Promise<void> {
    return removeItem(accessToken);
  }
}
