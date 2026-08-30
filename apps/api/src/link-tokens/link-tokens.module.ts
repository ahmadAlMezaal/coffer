import { Module } from '@nestjs/common';

import { LinkTokensController } from './link-tokens.controller';
import { LinkTokensService } from './link-tokens.service';

@Module({
  controllers: [LinkTokensController],
  providers: [LinkTokensService],
})
export class LinkTokensModule {}
