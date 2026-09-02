import { BalanceCards } from '@/components/balance-cards';
import { ConnectingBanner } from '@/components/connecting-banner';
import { FlowCard } from '@/components/flow-card';
import { Pagination } from '@/components/pagination';
import { RunwayCard } from '@/components/runway-card';
import { SyncNotice } from '@/components/sync-notice';
import { SyncWatcher } from '@/components/sync-watcher';
import { TransactionFilters } from '@/components/transaction-filters';
import { TransactionsTable } from '@/components/transactions-table';
import { readDashboard } from '@/lib/services/dashboard.service';
import { PAGE_SIZE, readFilters } from '@/lib/transactions-query';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const HomePage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const filters = readFilters(await searchParams);

  const dashboard = await readDashboard({
    accountId: filters.accountId,
    category: filters.category,
    from: filters.from,
    to: filters.to,
    counterparty: filters.counterparty,
    offset: (filters.page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const connecting = dashboard.state === 'syncing';

  return (
    <main className="mx-auto flex max-w-[76rem] flex-col gap-6 px-6 py-8 lg:px-10">
      {connecting ? <SyncWatcher /> : null}

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

      <ConnectingBanner consents={dashboard.consents} />

      <BalanceCards
        groups={dashboard.accounts.groups}
        totalBalance={dashboard.accounts.totalBalance}
        currency={dashboard.accounts.currency}
        loading={connecting}
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
          flow="outflow"
          amount={dashboard.stats.monthlyOutflow}
          currency={dashboard.stats.currency}
          changePercent={dashboard.stats.outflowChangePercent}
          monthComplete={dashboard.stats.monthComplete}
          series={dashboard.stats.monthlySeries}
        />

        <FlowCard
          flow="inflow"
          amount={dashboard.stats.monthlyInflow}
          currency={dashboard.stats.currency}
          changePercent={dashboard.stats.inflowChangePercent}
          monthComplete={dashboard.stats.monthComplete}
          series={dashboard.stats.monthlySeries}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-ink text-lg font-bold">Transactions</h2>
          <TransactionFilters
            groups={dashboard.accounts.groups}
            categories={dashboard.categories}
            filters={filters}
          />
        </div>

        <TransactionsTable
          transactions={dashboard.transactions.transactions}
          filters={filters}
          loading={connecting}
        />

        <Pagination
          filters={filters}
          total={dashboard.transactions.total}
          offset={dashboard.transactions.offset}
          shown={dashboard.transactions.transactions.length}
        />
      </section>
    </main>
  );
};

export default HomePage;
