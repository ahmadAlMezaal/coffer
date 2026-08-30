import { BankMark } from '@/components/bank-mark';
import { CategoryChip } from '@/components/category-chip';
import { preciseMoney, shortDate } from '@/lib/format';
import type { TransactionSummary } from '@coffer/contracts';

type TransactionsTableProps = {
  transactions: TransactionSummary[];
  loading: boolean;
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

export const TransactionsTable = ({ transactions, loading }: TransactionsTableProps) => (
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
            <td colSpan={COLUMNS} className="text-ink-muted px-5 py-12 text-center">
              No transactions match these filters. Widen the dates, or clear the search.
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
