'use server';

import { revalidatePath } from 'next/cache';

import { completeLink, disconnectBank, startLink } from '@/lib/services/dashboard.service';

export const requestLinkToken = async (): Promise<string> => startLink();

export const submitPublicToken = async (publicToken: string): Promise<void> => {
  await completeLink(publicToken);

  revalidatePath('/');
  revalidatePath('/accounts');
};

export const revokeConsent = async (consentId: string): Promise<void> => {
  await disconnectBank(consentId);

  revalidatePath('/');
  revalidatePath('/accounts');
};
