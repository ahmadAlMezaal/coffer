import { Controller, Get } from '@nestjs/common';

import { StatsService } from './stats.service';
import type { StatsResponse } from '@coffer/contracts';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  read(): Promise<StatsResponse> {
    return this.stats.read();
  }
}
