'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { DateRangePicker } from '@/components/date-range-picker';
import { SearchIcon } from '@/components/icons';
import type { AccountGroup, TransactionQuery } from '@coffer/contracts';

type TransactionFiltersProps = {
  groups: AccountGroup[];
  query: TransactionQuery;
};

const SEARCH_DEBOUNCE_MS = 400;

const toHref = (query: TransactionQuery): string => {
  const params = new URLSearchParams();

  if (query.accountId) {
    params.set('accountId', query.accountId);
  }

  if (query.from) {
    params.set('from', query.from);
  }

  if (query.to) {
    params.set('to', query.to);
  }

  if (query.counterparty) {
    params.set('counterparty', query.counterparty);
  }

  const search = params.toString();

  return search === '' ? '/' : `/?${search}`;
};

export const TransactionFilters = ({ groups, query }: TransactionFiltersProps) => {
  const { accountId, from, to } = query;
  const applied = query.counterparty ?? '';

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [counterparty, setCounterparty] = useState(applied);

  const apply = (changes: Partial<TransactionQuery>) => {
    startTransition(() => {
      router.replace(toHref({ accountId, from, to, counterparty: applied, ...changes }), {
        scroll: false,
      });
    });
  };

  useEffect(() => {
    if (counterparty === applied) {
      return;
    }

    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(toHref({ accountId, from, to, counterparty: counterparty || undefined }), {
          scroll: false,
        });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [counterparty, applied, accountId, from, to, router]);

  const accounts = groups.flatMap((group) =>
    group.accounts.map((account) => ({ ...account, institution: group.institution })),
  );

  return (
    <div
      data-pending={pending}
      className="flex flex-wrap items-center gap-2 transition-opacity data-[pending=true]:opacity-60"
    >
      <select
        aria-label="Account"
        value={accountId ?? ''}
        onChange={(event) => apply({ accountId: event.target.value || undefined })}
        className="border-hairline bg-surface text-ink hover:border-ink-faint max-w-[15rem] truncate rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
      >
        <option value="">All accounts</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.institution.name ?? 'Linked bank'}: {account.name}
          </option>
        ))}
      </select>

      <DateRangePicker
        from={from}
        to={to}
        onChange={(range) => apply({ from: range.from, to: range.to })}
      />

      <label className="border-hairline bg-surface focus-within:border-ink-faint flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors">
        <SearchIcon className="text-ink-muted h-4 w-4" />
        <input
          type="search"
          value={counterparty}
          placeholder="To or from"
          onChange={(event) => setCounterparty(event.target.value)}
          className="text-ink placeholder:text-ink-faint w-36 bg-transparent text-sm outline-none"
        />
      </label>
    </div>
  );
};
