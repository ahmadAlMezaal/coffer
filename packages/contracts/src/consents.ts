export type ConsentStatus = 'processing' | 'active' | 'reauth_required' | 'revoked';

export type SyncRunStatus = 'running' | 'succeeded' | 'failed';

export type ConsentSummary = {
  id: string;
  provider: string;
  institutionName: string | null;
  status: ConsentStatus;
  consentedAt: string;
  lastSyncedAt: string | null;
  accountCount: number;
  lastSyncStatus: SyncRunStatus | null;
  lastSyncError: string | null;
};

export type ConsentsResponse = {
  consents: ConsentSummary[];
};

export type CreateConsentRequestBody = {
  publicToken: string;
};

export type CreateConsentResponse = {
  consentId: string;
  status: ConsentStatus;
  accountsLinked: number;
};
