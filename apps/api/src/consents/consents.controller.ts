import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ConsentsService } from './consents.service';
import { CreateConsentDto } from './create-consent.dto';
import type { ConsentsResponse, CreateConsentResponse } from '@coffer/contracts';

@Controller('consents')
export class ConsentsController {
  constructor(private readonly consents: ConsentsService) {}

  @Get()
  list(): Promise<ConsentsResponse> {
    return this.consents.list();
  }

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Body() body: CreateConsentDto): Promise<CreateConsentResponse> {
    return this.consents.create(body.publicToken);
  }
}
