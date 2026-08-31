import Link from 'next/link';

import { BankMark } from '@/components/bank-mark';
import { CategoryChip } from '@/components/category-chip';
import { dateRangeSentence, preciseMoney, shortDate } from '@/lib/format';
import { isFiltered } from '@/lib/transactions-query';
import type { TransactionSummary } from '@coffer/contracts';
import type { TransactionFilters } from '@/lib/transactions-query';

type TransactionsTableProps = {
  transactions: TransactionSummary[];
  filters: TransactionFilters;
  loading: boolean;
};

const Nothing = ({ filters }: { filters: TransactionFilters }) => {
  if (!isFiltered(filters)) {
    return (
      <div className="flex flex-col items-center gap-1 px-5 py-12 text-center">
        <p className="text-ink text-sm font-semibold">No transactions yet</p>
        <p className="text-ink-muted max-w-sm text-sm">
          Your bank has not sent any through. They usually appear within a few minutes of
          connecting.
        </p>
      </div>
    );
  }

  const dated = filters.from !== undefined || filters.to !== undefined;

  return (
    <div className="flex flex-col items-center gap-1 px-5 py-12 text-center">
      <p className="text-ink text-sm font-semibold">
        {dated
          ? `No transactions ${dateRangeSentence(filters.from, filters.to)}`
          : 'No transactions match these filters'}
      </p>
      <p className="text-ink-muted max-w-sm text-sm">
        Try a wider date range, another account, or a different search.
      </p>
      <Link
        href="/"
        className="border-hairline text-ink hover:border-ink-faint mt-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
      >
        Clear all filters
      </Link>
    </div>
  );
};

const COLUMNS = 6;

const SkeletonRows = () => (
  <>
    {[0, 1, 2, 3, 4, 5].map((row) => (
      <tr key={row} className="border-hairline border-t">
        <td colSpan={COLUMNS} className="px-5 py-3.5">
          <span className="bg-surface-muted block h-3 w-full animate-pulse rounded" />
        </td>
      </tr>
    ))}
  </>
);

export const TransactionsTable = ({ transactions, filters, loading }: TransactionsTableProps) => (
  <div className="card overflow-x-auto">
    <table className="w-full min-w-[860px] text-left text-sm">
      <thead>
        <tr className="border-hairline border-b">
          <th className="eyebrow px-5 py-3.5 font-semibold">Date</th>
          <th className="eyebrow px-5 py-3.5 font-semibold">To or from</th>
          <th className="eyebrow px-5 py-3.5 font-semibold">Bank</th>
          <th className="eyebrow px-5 py-3.5 font-semibold">Category</th>
          <th className="eyebrow px-5 py-3.5 text-right font-semibold">Amount</th>
          <th className="eyebrow px-5 py-3.5 font-semibold">Account</th>
        </tr>
      </thead>
      <tbody>
        {loading && transactions.length === 0 ? <SkeletonRows /> : null}

        {!loading && transactions.length === 0 ? (
          <tr>
            <td colSpan={COLUMNS}>
              <Nothing filters={filters} />
            </td>
          </tr>
        ) : null}

        {transactions.map((transaction) => (
          <tr
            key={transaction.id}
            className="border-hairline hover:bg-surface-muted/50 border-t transition-colors"
          >
            <td className="text-ink-muted px-5 py-3.5 whitespace-nowrap tabular-nums">
              {shortDate(transaction.bookedAt)}
            </td>

            <td className="text-ink px-5 py-3.5 font-medium">
              {transaction.merchantName ?? transaction.description}
              {transaction.isInternalTransfer ? (
                <span className="border-hairline text-ink-faint ml-2 rounded-full border px-2 py-0.5 text-[0.6875rem] font-normal">
                  internal transfer
                </span>
              ) : null}
            </td>

            <td className="px-5 py-3.5">
              <BankMark institution={transaction.institution} size="sm" />
            </td>

            <td className="px-5 py-3.5">
              <CategoryChip category={transaction.category} />
            </td>

            <td
              className={`px-5 py-3.5 text-right font-semibold whitespace-nowrap tabular-nums ${
                transaction.direction === 'in' ? 'text-inflow' : 'text-outflow'
              }`}
            >
              {transaction.direction === 'in' ? '+' : '−'}
              {preciseMoney(transaction.amount, transaction.currency)}
            </td>

            <td className="text-ink-muted px-5 py-3.5 whitespace-nowrap">
              {transaction.accountName}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
