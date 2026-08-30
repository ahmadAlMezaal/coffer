export const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';

export const TEMPORAL_TASK_QUEUE = 'coffer-sync';

export const SEEDED_USER_ID = process.env.COFFER_USER_ID ?? '00000000-0000-4000-8000-000000000001';

export const SEEDED_USER_EMAIL = process.env.COFFER_USER_EMAIL ?? 'owner@coffer.test';

export const MAX_PLAID_CALLS_PER_SECOND = 5;
