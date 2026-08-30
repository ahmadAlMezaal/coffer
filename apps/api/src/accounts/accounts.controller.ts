import { Controller, Get } from '@nestjs/common';

import { AccountsService } from './accounts.service';
import type { AccountsResponse } from '@coffer/contracts';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(): Promise<AccountsResponse> {
    return this.accounts.list();
  }
}
