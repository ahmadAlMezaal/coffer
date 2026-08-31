'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { DateRangePicker } from '@/components/date-range-picker';
import { SearchIcon } from '@/components/icons';
import { filtersHref } from '@/lib/transactions-query';
import type { AccountGroup } from '@coffer/contracts';
import type { TransactionFilters as Filters } from '@/lib/transactions-query';

type TransactionFiltersProps = {
  groups: AccountGroup[];
  categories: string[];
  filters: Filters;
};

const SEARCH_DEBOUNCE_MS = 400;

const field =
  'border-hairline bg-surface text-ink hover:border-ink-faint rounded-lg border px-3 py-2 text-sm font-medium transition-colors';

export const TransactionFilters = ({ groups, categories, filters }: TransactionFiltersProps) => {
  const { accountId, category, from, to } = filters;
  const applied = filters.counterparty ?? '';

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [counterparty, setCounterparty] = useState(applied);

  const apply = (changes: Partial<Filters>) => {
    startTransition(() => {
      router.replace(
        filtersHref({ accountId, category, from, to, counterparty: applied, ...changes, page: 1 }),
        { scroll: false },
      );
    });
  };

  useEffect(() => {
    if (counterparty === applied) {
      return;
    }

    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(
          filtersHref({
            accountId,
            category,
            from,
            to,
            counterparty: counterparty || undefined,
            page: 1,
          }),
          { scroll: false },
        );
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [counterparty, applied, accountId, category, from, to, router]);

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
        className={`${field} max-w-[15rem] truncate`}
      >
        <option value="">All accounts</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.institution.name ?? 'Linked bank'}: {account.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Category"
        value={category ?? ''}
        onChange={(event) => apply({ category: event.target.value || undefined })}
        className={`${field} max-w-[12rem] truncate`}
      >
        <option value="">All categories</option>
        {categories.map((name) => (
          <option key={name} value={name}>
            {name}
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
