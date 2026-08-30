import { BankMark } from '@/components/bank-mark';
import { ConnectBank } from '@/components/connect-bank';
import { RefreshIcon } from '@/components/icons';
import { preciseMoney, relativeTime } from '@/lib/format';
import type { AccountGroup } from '@coffer/contracts';

type BalanceCardsProps = {
  groups: AccountGroup[];
  totalBalance: string;
  currency: string;
  loading: boolean;
};

const Skeleton = () => (
  <div className="border-hairline bg-surface-muted h-[132px] animate-pulse rounded-[0.875rem] border" />
);

export const BalanceCards = ({ groups, totalBalance, currency, loading }: BalanceCardsProps) => {
  const accounts = groups.flatMap((group) =>
    group.accounts.map((account) => ({
      ...account,
      institution: group.institution,
      lastSyncedAt: group.lastSyncedAt,
    })),
  );

  if (loading && accounts.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <section className="bg-plum flex flex-col rounded-[0.875rem] p-5 text-white">
        <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-white/60 uppercase">
          Total balance
        </p>
        <p className="figure mt-3 text-2xl font-extrabold">
          {preciseMoney(totalBalance, currency)}
        </p>
        <p className="mt-auto pt-3 text-xs text-white/60">
          Across {accounts.length} account{accounts.length === 1 ? '' : 's'} at {groups.length} bank
          {groups.length === 1 ? '' : 's'}
        </p>
      </section>

      {accounts.map((account) => (
        <section key={account.id} className="card flex flex-col p-5">
          <div className="flex items-center gap-2.5">
            <BankMark institution={account.institution} size="sm" />
            <p className="text-ink truncate text-sm font-semibold">
              {account.institution.name ?? 'Linked bank'}
            </p>
          </div>

          <p className="figure text-ink mt-3 text-2xl font-extrabold">
            {preciseMoney(account.currentBalance, account.currency)}
          </p>

          <p className="text-ink-muted mt-1 truncate text-xs">
            {account.name}
            {account.mask === null ? '' : ` (••${account.mask})`}
          </p>

          <p className="text-ink-faint mt-auto flex items-center gap-1.5 pt-3 text-xs">
            <RefreshIcon className="h-3.5 w-3.5" />
            {account.lastSyncedAt === null
              ? 'Not synced yet'
              : `Synced ${relativeTime(account.lastSyncedAt)}`}
          </p>
        </section>
      ))}

      <ConnectBank
        label={accounts.length === 0 ? 'Connect a bank' : 'Link bank account'}
        variant="card"
      />
    </div>
  );
};
