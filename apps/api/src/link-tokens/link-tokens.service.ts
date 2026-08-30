import { Injectable } from '@nestjs/common';

import { SEEDED_USER_ID } from '../config/app';
import { ProviderService } from '../provider/provider.service';
import type { CreateLinkTokenResponse } from '@coffer/contracts';

@Injectable()
export class LinkTokensService {
  constructor(private readonly provider: ProviderService) {}

  async create(): Promise<CreateLinkTokenResponse> {
    const token = await this.provider.createLinkToken(SEEDED_USER_ID);

    return { linkToken: token.linkToken, expiresAt: token.expiresAt };
  }
}
