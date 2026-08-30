import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';

import { ConsentsController } from './consents.controller';
import { ConsentsRepository } from './consents.repository';
import { ConsentsService } from './consents.service';

@Module({
  imports: [AccountsModule],
  controllers: [ConsentsController],
  providers: [ConsentsService, ConsentsRepository],
  exports: [ConsentsRepository],
})
export class ConsentsModule {}
