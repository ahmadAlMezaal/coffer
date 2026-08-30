import axios from 'axios';

import { API_URL } from '../config';
import type {
  AccountsResponse,
  ConsentsResponse,
  CreateConsentResponse,
  CreateLinkTokenResponse,
  StatsResponse,
  TransactionQuery,
  TransactionsResponse,
} from '@coffer/contracts';

const client = axios.create({ baseURL: API_URL, timeout: 15_000 });

export const getConsents = async (): Promise<ConsentsResponse> => {
  const response = await client.get<ConsentsResponse>('/consents');

  return response.data;
};

export const getAccounts = async (): Promise<AccountsResponse> => {
  const response = await client.get<AccountsResponse>('/accounts');

  return response.data;
};

export const getTransactions = async (query: TransactionQuery): Promise<TransactionsResponse> => {
  const response = await client.get<TransactionsResponse>('/transactions', { params: query });

  return response.data;
};

export const getStats = async (): Promise<StatsResponse> => {
  const response = await client.get<StatsResponse>('/stats');

  return response.data;
};

export const createLinkToken = async (): Promise<CreateLinkTokenResponse> => {
  const response = await client.post<CreateLinkTokenResponse>('/link-tokens');

  return response.data;
};

export const createConsent = async (publicToken: string): Promise<CreateConsentResponse> => {
  const response = await client.post<CreateConsentResponse>('/consents', { publicToken });

  return response.data;
};
