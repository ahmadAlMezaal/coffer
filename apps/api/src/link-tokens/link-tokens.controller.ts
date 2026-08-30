import { Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { LinkTokensService } from './link-tokens.service';
import type { CreateLinkTokenResponse } from '@coffer/contracts';

@Controller('link-tokens')
export class LinkTokensController {
  constructor(private readonly linkTokens: LinkTokensService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ link: { limit: 5, ttl: 60_000 } })
  create(): Promise<CreateLinkTokenResponse> {
    return this.linkTokens.create();
  }
}
