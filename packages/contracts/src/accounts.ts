import type { ConsentStatus, Institution } from './consents';

export type AccountSummary = {
  id: string;
  consentId: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
  isCash: boolean;
  currency: string;
  currentBalance: string;
  availableBalance: string | null;
  balanceAsOf: string;
};

export type AccountGroup = {
  consentId: string;
  institution: Institution;
  status: ConsentStatus;
  expiresAt: string | null;
  lastSyncedAt: string | null;
  accounts: AccountSummary[];
};

export type AccountsResponse = {
  groups: AccountGroup[];
  totalBalance: string;
  currency: string;
};
