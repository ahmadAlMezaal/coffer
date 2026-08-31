import axios from 'axios';

import { API_URL, API_TIMEOUT_MS } from '../config';
import type { AxiosResponse } from 'axios';
import type {
  AccountsResponse,
  ConsentsResponse,
  CreateConsentResponse,
  CreateLinkTokenResponse,
  RevokeConsentResponse,
  StatsResponse,
  TransactionCategoriesResponse,
  TransactionQuery,
  TransactionsResponse,
  UserResponse,
} from '@coffer/contracts';

export type ApiFailureKind = 'unreachable' | 'rejected';

export class ApiError extends Error {
  readonly kind: ApiFailureKind;
  readonly status: number | null;

  constructor(kind: ApiFailureKind, status: number | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

const client = axios.create({ baseURL: API_URL, timeout: API_TIMEOUT_MS });

const describeRejection = (response: AxiosResponse): string => {
  const body = response.data as { message?: unknown } | undefined;

  if (typeof body?.message === 'string') {
    return `${response.status} ${body.message}`;
  }

  if (Array.isArray(body?.message)) {
    return `${response.status} ${body.message.join(', ')}`;
  }

  return `${response.status} ${response.statusText}`;
};

const toApiError = (error: unknown): ApiError => {
  if (!axios.isAxiosError(error)) {
    return new ApiError('unreachable', null, 'The request failed before it reached the API.');
  }

  if (error.response) {
    return new ApiError('rejected', error.response.status, describeRejection(error.response));
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError(
      'unreachable',
      null,
      `The API did not answer within ${API_TIMEOUT_MS / 1000} seconds.`,
    );
  }

  return new ApiError('unreachable', null, error.message);
};

const request = async <T>(send: () => Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const response = await send();

    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getConsents = (): Promise<ConsentsResponse> =>
  request(() => client.get<ConsentsResponse>('/consents'));

export const getAccounts = (): Promise<AccountsResponse> =>
  request(() => client.get<AccountsResponse>('/accounts'));

export const getTransactions = (query: TransactionQuery): Promise<TransactionsResponse> =>
  request(() => client.get<TransactionsResponse>('/transactions', { params: query }));

export const getTransactionCategories = (): Promise<TransactionCategoriesResponse> =>
  request(() => client.get<TransactionCategoriesResponse>('/transactions/categories'));

export const getStats = (): Promise<StatsResponse> =>
  request(() => client.get<StatsResponse>('/stats'));

export const createLinkToken = (): Promise<CreateLinkTokenResponse> =>
  request(() => client.post<CreateLinkTokenResponse>('/link-tokens'));

export const createConsent = (publicToken: string): Promise<CreateConsentResponse> =>
  request(() => client.post<CreateConsentResponse>('/consents', { publicToken }));

export const deleteConsent = (consentId: string): Promise<RevokeConsentResponse> =>
  request(() => client.delete<RevokeConsentResponse>(`/consents/${consentId}`));

export const getUser = (): Promise<UserResponse> => request(() => client.get<UserResponse>('/me'));
