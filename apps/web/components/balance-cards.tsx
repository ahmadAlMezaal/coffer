import { money, preciseMoney, relativeTime } from '@/lib/format';
import type { AccountGroup } from '@coffer/contracts';

type BalanceCardsProps = {
  groups: AccountGroup[];
  totalBalance: string;
  currency: string;
  loading: boolean;
};

const Skeleton = () => (
  <div className="h-[104px] animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
);

export const BalanceCards = ({ groups, totalBalance, currency, loading }: BalanceCardsProps) => {
  const accounts = groups.flatMap((group) =>
    group.accounts.map((account) => ({ ...account, institutionName: group.institutionName })),
  );

  if (loading && accounts.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-neutral-900 bg-neutral-900 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Total balance</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {preciseMoney(totalBalance, currency)}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          {accounts.length} account{accounts.length === 1 ? '' : 's'}
        </p>
      </div>

      {accounts.map((account) => (
        <div key={account.id} className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="truncate text-xs uppercase tracking-wide text-neutral-500">
            {account.institutionName ?? 'Linked bank'}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">
            {money(account.currentBalance, account.currency)}
          </p>
          <p className="mt-1 truncate text-xs text-neutral-500">
            {account.name}
            {account.mask ? ` ••${account.mask}` : ''}
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">
            Balance as of {relativeTime(account.balanceAsOf)}
          </p>
        </div>
      ))}
    </div>
  );
};
