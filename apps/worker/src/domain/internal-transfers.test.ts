import { describe, expect, it } from 'vitest';

import { pairInternalTransfers } from './internal-transfers';
import type { TransferCandidate } from './internal-transfers';

const candidate = (overrides: Partial<TransferCandidate>): TransferCandidate => ({
  id: 'a',
  accountId: 'account-1',
  amount: '2500.00',
  direction: 'out',
  bookedAt: new Date('2026-08-10'),
  ...overrides,
});

describe('pairInternalTransfers', () => {
  it('pairs an equal and opposite movement between two accounts', () => {
    const pairs = pairInternalTransfers([
      candidate({ id: 'out-1', accountId: 'account-1', direction: 'out' }),
      candidate({ id: 'in-1', accountId: 'account-2', direction: 'in' }),
    ]);

    expect(pairs).toEqual([{ outgoingId: 'out-1', incomingId: 'in-1' }]);
  });

  it('ignores a movement inside a single account', () => {
    const pairs = pairInternalTransfers([
      candidate({ id: 'out-1', accountId: 'account-1', direction: 'out' }),
      candidate({ id: 'in-1', accountId: 'account-1', direction: 'in' }),
    ]);

    expect(pairs).toEqual([]);
  });

  it('ignores a match more than three days apart', () => {
    const pairs = pairInternalTransfers([
      candidate({ id: 'out-1', accountId: 'account-1', bookedAt: new Date('2026-08-01') }),
      candidate({
        id: 'in-1',
        accountId: 'account-2',
        direction: 'in',
        bookedAt: new Date('2026-08-06'),
      }),
    ]);

    expect(pairs).toEqual([]);
  });

  it('ignores a different amount', () => {
    const pairs = pairInternalTransfers([
      candidate({ id: 'out-1', amount: '2500.00' }),
      candidate({ id: 'in-1', accountId: 'account-2', direction: 'in', amount: '2500.01' }),
    ]);

    expect(pairs).toEqual([]);
  });

  it('never claims one credit for two debits', () => {
    const pairs = pairInternalTransfers([
      candidate({ id: 'out-1', accountId: 'account-1' }),
      candidate({ id: 'out-2', accountId: 'account-3' }),
      candidate({ id: 'in-1', accountId: 'account-2', direction: 'in' }),
    ]);

    expect(pairs).toEqual([{ outgoingId: 'out-1', incomingId: 'in-1' }]);
  });
});
