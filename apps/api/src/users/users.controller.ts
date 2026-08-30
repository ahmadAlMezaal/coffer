import { Controller, Get } from '@nestjs/common';

import { UsersService } from './users.service';
import type { UserResponse } from '@coffer/contracts';

@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  readCurrent(): Promise<UserResponse> {
    return this.users.readCurrent();
  }
}
