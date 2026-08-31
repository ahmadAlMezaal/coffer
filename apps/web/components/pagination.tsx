import Link from 'next/link';

import { ChevronIcon } from '@/components/icons';
import { filtersHref } from '@/lib/transactions-query';
import type { TransactionFilters } from '@/lib/transactions-query';

type PaginationProps = {
  filters: TransactionFilters;
  total: number;
  offset: number;
  shown: number;
};

const step =
  'border-hairline text-ink flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors';

export const Pagination = ({ filters, total, offset, shown }: PaginationProps) => {
  if (total === 0) {
    return null;
  }

  const first = offset + 1;
  const last = offset + shown;
  const hasPrevious = filters.page > 1;
  const hasNext = last < total;

  return (
    <nav
      aria-label="Transaction pages"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-ink-muted text-xs tabular-nums">
        Showing {first.toLocaleString('en-GB')} to {last.toLocaleString('en-GB')} of{' '}
        {total.toLocaleString('en-GB')}
      </p>

      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Link
            href={filtersHref({ ...filters, page: filters.page - 1 })}
            className={`${step} bg-surface hover:border-ink-faint`}
          >
            <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
            Previous
          </Link>
        ) : (
          <span className={`${step} text-ink-faint bg-surface-muted`} aria-disabled="true">
            <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
            Previous
          </span>
        )}

        {hasNext ? (
          <Link
            href={filtersHref({ ...filters, page: filters.page + 1 })}
            className={`${step} bg-surface hover:border-ink-faint`}
          >
            Next
            <ChevronIcon className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className={`${step} text-ink-faint bg-surface-muted`} aria-disabled="true">
            Next
            <ChevronIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </nav>
  );
};
