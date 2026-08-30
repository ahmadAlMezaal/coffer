import { Injectable } from '@nestjs/common';

import { prisma } from '@coffer/database';
import type { PrismaClient } from '@coffer/database';

@Injectable()
export class DatabaseService {
  readonly client: PrismaClient = prisma;
}
