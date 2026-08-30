import type { ConsentStatus } from './consents';

export type AccountSummary = {
  id: string;
  consentId: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
  currency: string;
  currentBalance: string;
  availableBalance: string | null;
  balanceAsOf: string;
};

export type AccountGroup = {
  consentId: string;
  institutionName: string | null;
  status: ConsentStatus;
  lastSyncedAt: string | null;
  accounts: AccountSummary[];
};

export type AccountsResponse = {
  groups: AccountGroup[];
  totalBalance: string;
  currency: string;
};
