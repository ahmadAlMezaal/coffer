import type { AccountGroup, TransactionQuery } from '@coffer/contracts';

type TransactionFiltersProps = {
  groups: AccountGroup[];
  query: TransactionQuery;
};

const fieldClass =
  'rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900';

export const TransactionFilters = ({ groups, query }: TransactionFiltersProps) => {
  const accounts = groups.flatMap((group) => group.accounts);

  return (
    <form method="get" className="flex flex-wrap items-center gap-2">
      <select name="accountId" defaultValue={query.accountId ?? ''} className={fieldClass}>
        <option value="">All accounts</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>

      <input type="date" name="from" defaultValue={query.from ?? ''} className={fieldClass} />
      <input type="date" name="to" defaultValue={query.to ?? ''} className={fieldClass} />

      <input
        type="search"
        name="counterparty"
        placeholder="To or from"
        defaultValue={query.counterparty ?? ''}
        className={fieldClass}
      />

      <button
        type="submit"
        className="rounded-lg border border-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
      >
        Filter
      </button>
    </form>
  );
};
