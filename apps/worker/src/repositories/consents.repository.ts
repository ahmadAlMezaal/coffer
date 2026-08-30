import { prisma } from '@coffer/database';

export type ConsentForSync = {
  id: string;
  userId: string;
  accessToken: string;
  syncCursor: string | null;
};

export const findForSync = async (consentId: string): Promise<ConsentForSync> => {
  const consent = await prisma.accessConsent.findUnique({
    where: { id: consentId },
    select: { id: true, userId: true, accessToken: true, syncCursor: true },
  });

  if (!consent) {
    throw new Error(`No access consent ${consentId}`);
  }

  return consent;
};

export const persistCursor = async (consentId: string, cursor: string): Promise<void> => {
  await prisma.accessConsent.update({
    where: { id: consentId },
    data: { syncCursor: cursor },
  });
};

export const markSynced = async (consentId: string, at: Date): Promise<void> => {
  await prisma.accessConsent.update({
    where: { id: consentId },
    data: { status: 'active', lastSyncedAt: at },
  });
};
