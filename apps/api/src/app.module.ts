import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AccountsModule } from './accounts/accounts.module';
import { ConsentsModule } from './consents/consents.module';
import { DatabaseModule } from './database/database.module';
import { LinkTokensModule } from './link-tokens/link-tokens.module';
import { ProviderModule } from './provider/provider.module';
import { StatsModule } from './stats/stats.module';
import { TemporalModule } from './temporal/temporal.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', limit: 120, ttl: 60_000 }],
    }),
    DatabaseModule,
    ProviderModule,
    TemporalModule,
    LinkTokensModule,
    ConsentsModule,
    AccountsModule,
    TransactionsModule,
    StatsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
