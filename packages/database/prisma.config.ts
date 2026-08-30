import path from 'node:path';

import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({
  path: [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')],
  quiet: true,
});

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
