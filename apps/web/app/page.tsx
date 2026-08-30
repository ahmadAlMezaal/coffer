import { BalanceCards } from '@/components/balance-cards';
import { ConnectBank } from '@/components/connect-bank';
import { RunwayChart } from '@/components/runway-chart';
import { StatCards } from '@/components/stat-cards';
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
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Coffer</h1>
          <SyncNotice
            state={dashboard.state}
            lastSyncedAt={dashboard.lastSyncedAt}
            syncError={dashboard.syncError}
            apiError={dashboard.apiError}
          />
        </div>
        <ConnectBank label={dashboard.consents.length === 0 ? 'Connect a bank' : 'Add a bank'} />
      </header>

      <BalanceCards
        groups={dashboard.accounts.groups}
        totalBalance={dashboard.accounts.totalBalance}
        currency={dashboard.accounts.currency}
        loading={loading}
      />

      <StatCards stats={dashboard.stats} />

      <RunwayChart
        points={dashboard.stats.projection}
        currency={dashboard.stats.currency}
        netBurn={dashboard.stats.netBurn}
      />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-neutral-900">Transactions</h2>
          <TransactionFilters groups={dashboard.accounts.groups} query={query} />
        </div>

        <TransactionsTable transactions={dashboard.transactions.transactions} loading={loading} />
      </section>
    </main>
  );
};

export default HomePage;
