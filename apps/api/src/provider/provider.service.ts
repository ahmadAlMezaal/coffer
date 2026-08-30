import { Injectable } from '@nestjs/common';

import {
  createLinkToken,
  exchangePublicToken,
  fetchAccounts,
  fetchInstitutionName,
} from '@coffer/provider';
import type { Captured, LinkToken, LinkedItem, NormalisedAccount } from '@coffer/provider';

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

  fetchInstitutionName(institutionId: string): Promise<string | null> {
    return fetchInstitutionName(institutionId);
  }
}
