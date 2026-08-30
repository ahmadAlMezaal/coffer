import { prisma } from '@coffer/database';
import type { Prisma } from '@coffer/database';
import type { RawCapture } from '@coffer/provider';

export const write = async (
  accessConsentId: string,
  syncRunId: string | null,
  raw: RawCapture,
): Promise<string> => {
  const row = await prisma.rawProviderPayload.create({
    data: {
      accessConsentId,
      syncRunId,
      endpoint: raw.endpoint,
      requestCursor: raw.requestCursor,
      responseBody: raw.responseBody as Prisma.InputJsonValue,
      responseHash: raw.responseHash,
      httpStatus: raw.httpStatus,
    },
    select: { id: true },
  });

  return row.id;
};

export const readBody = async (rawPayloadId: string): Promise<unknown> => {
  const row = await prisma.rawProviderPayload.findUnique({
    where: { id: rawPayloadId },
    select: { responseBody: true },
  });

  if (!row) {
    throw new Error(`No raw provider payload ${rawPayloadId}`);
  }

  return row.responseBody;
};

export const listForConsent = async (
  accessConsentId: string,
  endpoint: string,
): Promise<{ id: string; responseBody: unknown }[]> =>
  prisma.rawProviderPayload.findMany({
    where: { accessConsentId, endpoint },
    orderBy: { receivedAt: 'asc' },
    select: { id: true, responseBody: true },
  });
