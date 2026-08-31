export const PAGE_SIZE = 25;

export type TransactionFilters = {
  accountId?: string;
  category?: string;
  from?: string;
  to?: string;
  counterparty?: string;
  page: number;
};

export const emptyFilters: TransactionFilters = { page: 1 };

const single = (value: string | string[] | undefined): string | undefined => {
  const first = Array.isArray(value) ? value[0] : value;

  if (first === undefined || first.trim() === '') {
    return undefined;
  }

  return first;
};

const toPage = (value: string | string[] | undefined): number => {
  const parsed = Number(single(value));

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
};

export const readFilters = (
  params: Record<string, string | string[] | undefined>,
): TransactionFilters => ({
  accountId: single(params.accountId),
  category: single(params.category),
  from: single(params.from),
  to: single(params.to),
  counterparty: single(params.counterparty),
  page: toPage(params.page),
});

export const filtersHref = (filters: TransactionFilters): string => {
  const params = new URLSearchParams();

  if (filters.accountId) {
    params.set('accountId', filters.accountId);
  }

  if (filters.category) {
    params.set('category', filters.category);
  }

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  if (filters.counterparty) {
    params.set('counterparty', filters.counterparty);
  }

  if (filters.page > 1) {
    params.set('page', String(filters.page));
  }

  const search = params.toString();

  return search === '' ? '/' : `/?${search}`;
};

export const isFiltered = (filters: TransactionFilters): boolean =>
  filters.accountId !== undefined ||
  filters.category !== undefined ||
  filters.from !== undefined ||
  filters.to !== undefined ||
  filters.counterparty !== undefined;

export const monthRange = (month: string): { from: string; to: string } => {
  const start = new Date(`${month}T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  const today = new Date().toISOString().slice(0, 10);
  const last = end.toISOString().slice(0, 10);

  return { from: month, to: last > today ? today : last };
};
