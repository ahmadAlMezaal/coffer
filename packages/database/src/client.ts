import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
