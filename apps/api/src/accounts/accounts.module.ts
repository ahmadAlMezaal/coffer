import { Module } from '@nestjs/common';

import { ConsentsRepository } from '../consents/consents.repository';

import { AccountsController } from './accounts.controller';
import { AccountsRepository } from './accounts.repository';
import { AccountsService } from './accounts.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository, ConsentsRepository],
  exports: [AccountsRepository],
})
export class AccountsModule {}
