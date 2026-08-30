import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type { User } from '@coffer/database';

@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  find(userId: string): Promise<User | null> {
    return this.database.client.user.findUnique({ where: { id: userId } });
  }
}
