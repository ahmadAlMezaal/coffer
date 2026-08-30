import { Injectable } from '@nestjs/common';

import { SEEDED_USER_EMAIL, SEEDED_USER_ID } from '../config/app';

import { UsersRepository } from './users.repository';
import type { UserResponse } from '@coffer/contracts';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async readCurrent(): Promise<UserResponse> {
    const user = await this.users.find(SEEDED_USER_ID);

    if (user === null) {
      return {
        id: SEEDED_USER_ID,
        email: SEEDED_USER_EMAIL,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
