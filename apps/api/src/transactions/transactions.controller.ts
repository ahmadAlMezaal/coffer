import { Controller, Get, Query } from '@nestjs/common';

import { TransactionQueryDto } from './transaction-query.dto';
import { TransactionsService } from './transactions.service';
import type { TransactionsResponse } from '@coffer/contracts';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(@Query() query: TransactionQueryDto): Promise<TransactionsResponse> {
    return this.transactions.list(query);
  }
}
