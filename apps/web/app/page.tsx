import { BalanceCards } from '@/components/balance-cards';
import { FlowCard } from '@/components/flow-card';
import { RunwayCard } from '@/components/runway-card';
import { SyncNotice } from '@/components/sync-notice';
import { TransactionFilters } from '@/components/transaction-filters';
import { TransactionsTable } from '@/components/transactions-table';
import { readDashboard } from '@/lib/services/dashboard.service';
import type { TransactionQuery } from '@coffer/contracts';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const single = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  if (value === '') {
    return undefined;
  }

  return value;
};

const HomePage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;

  const query: TransactionQuery = {
    accountId: single(params.accountId),
    from: single(params.from),
    to: single(params.to),
    counterparty: single(params.counterparty),
    limit: 50,
  };

  const dashboard = await readDashboard(query);
  const loading = dashboard.state === 'syncing';

  return (
    <main className="mx-auto flex max-w-[76rem] flex-col gap-6 px-6 py-8 lg:px-10">
      <header className="min-w-0">
        <h1 className="font-display text-ink text-2xl font-extrabold tracking-tight">Overview</h1>
        <div className="mt-1.5">
          <SyncNotice
            state={dashboard.state}
            lastSyncedAt={dashboard.lastSyncedAt}
            syncError={dashboard.syncError}
            apiError={dashboard.apiError}
          />
        </div>
      </header>

      <BalanceCards
        groups={dashboard.accounts.groups}
        totalBalance={dashboard.accounts.totalBalance}
        currency={dashboard.accounts.currency}
        loading={loading}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <RunwayCard
          points={dashboard.stats.projection}
          currency={dashboard.stats.currency}
          netBurn={dashboard.stats.netBurn}
          runwayLabel={dashboard.stats.runwayLabel}
          cashZeroAt={dashboard.stats.cashZeroAt}
        />

        <FlowCard
          title="Monthly spend"
          amount={dashboard.stats.monthlyOutflow}
          currency={dashboard.stats.currency}
          changePercent={dashboard.stats.outflowChangePercent}
          series={dashboard.stats.monthlySeries}
          read={(total) => total.outflow}
          goodWhenRising={false}
        />

        <FlowCard
          title="Monthly income"
          amount={dashboard.stats.monthlyInflow}
          currency={dashboard.stats.currency}
          changePercent={dashboard.stats.inflowChangePercent}
          series={dashboard.stats.monthlySeries}
          read={(total) => total.inflow}
          goodWhenRising
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-ink text-lg font-bold">Transactions</h2>
          <TransactionFilters groups={dashboard.accounts.groups} query={query} />
        </div>

        <TransactionsTable transactions={dashboard.transactions.transactions} loading={loading} />

        {dashboard.transactions.nextCursor === null ? null : (
          <p className="text-ink-faint text-xs">
            Showing the {dashboard.transactions.transactions.length} most recent. Narrow the dates
            to see further back.
          </p>
        )}
      </section>
    </main>
  );
};

export default HomePage;
