import { preciseMoney, shortDate } from '@/lib/format';
import type { TransactionSummary } from '@coffer/contracts';

type TransactionsTableProps = {
  transactions: TransactionSummary[];
  loading: boolean;
};

const SkeletonRows = () => (
  <>
    {[0, 1, 2, 3, 4, 5].map((row) => (
      <tr key={row} className="border-t border-neutral-100">
        <td colSpan={5} className="px-4 py-3">
          <span className="block h-3 w-full animate-pulse rounded bg-neutral-100" />
        </td>
      </tr>
    ))}
  </>
);

export const TransactionsTable = ({ transactions, loading }: TransactionsTableProps) => (
  <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-neutral-500">
          <th className="px-4 py-3 font-medium">Date</th>
          <th className="px-4 py-3 font-medium">To or from</th>
          <th className="px-4 py-3 font-medium">Account</th>
          <th className="px-4 py-3 font-medium">Category</th>
          <th className="px-4 py-3 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        {loading && transactions.length === 0 ? <SkeletonRows /> : null}

        {!loading && transactions.length === 0 ? (
          <tr className="border-t border-neutral-100">
            <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
              No transactions match these filters.
            </td>
          </tr>
        ) : null}

        {transactions.map((transaction) => (
          <tr key={transaction.id} className="border-t border-neutral-100">
            <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-500">
              {shortDate(transaction.bookedAt)}
            </td>
            <td className="px-4 py-3 text-neutral-900">
              {transaction.merchantName ?? transaction.description}
              {transaction.isInternalTransfer ? (
                <span className="ml-2 rounded border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500">
                  internal transfer
                </span>
              ) : null}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
              {transaction.accountName}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
              {transaction.category ?? '—'}
            </td>
            <td
              className={`whitespace-nowrap px-4 py-3 text-right tabular-nums ${
                transaction.direction === 'in' ? 'text-emerald-600' : 'text-neutral-900'
              }`}
            >
              {transaction.direction === 'in' ? '+' : '−'}
              {preciseMoney(transaction.amount, transaction.currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
