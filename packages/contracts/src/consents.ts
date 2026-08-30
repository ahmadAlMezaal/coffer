export type ConsentStatus = 'processing' | 'active' | 'reauth_required' | 'revoked';

export type SyncRunStatus = 'running' | 'succeeded' | 'failed';

export type Institution = {
  id: string | null;
  name: string | null;
  logo: string | null;
  colour: string | null;
};

export type ConsentSummary = {
  id: string;
  provider: string;
  institution: Institution;
  status: ConsentStatus;
  consentedAt: string;
  expiresAt: string | null;
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

export type RevokeConsentResponse = {
  consentId: string;
  status: ConsentStatus;
};
