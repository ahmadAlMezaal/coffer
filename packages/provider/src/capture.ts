import { createHash } from 'node:crypto';
import type { RawCapture } from './types';

export const hashPayload = (body: unknown): string =>
  createHash('sha256').update(JSON.stringify(body)).digest('hex');

export const capture = (
  endpoint: string,
  requestCursor: string | null,
  responseBody: unknown,
  httpStatus: number,
): RawCapture => ({
  endpoint,
  requestCursor,
  responseBody,
  responseHash: hashPayload(responseBody),
  httpStatus,
});
