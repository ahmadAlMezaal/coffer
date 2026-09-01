import { describe, expect, it } from 'vitest';

import { isCashAccount, normaliseAccount, normaliseTransaction } from './normalise';
import type { AccountBase, Transaction } from 'plaid';

const transaction = (overrides: Partial<Transaction>): Transaction =>
  ({
    account_id: 'acc_1',
    amount: 12.5,
    iso_currency_code: 'GBP',
    unofficial_currency_code: null,
    date: '2026-08-01',
    name: 'Coffee',
    merchant_name: null,
    pending: false,
    pending_transaction_id: null,
    account_owner: null,
    transaction_id: 'txn_1',
    authorized_date: null,
    authorized_datetime: null,
    datetime: null,
    payment_channel: 'online',
    transaction_code: null,
    location: {},
    payment_meta: {},
    ...overrides,
  }) as Transaction;

describe('normaliseTransaction', () => {
  it('reads a positive Plaid amount as money leaving the account', () => {
    const result = normaliseTransaction(transaction({ amount: 42.55 }));

    expect(result.direction).toBe('out');
    expect(result.amount).toBe('42.55');
  });

  it('reads a negative Plaid amount as money arriving', () => {
    const result = normaliseTransaction(transaction({ amount: -1200 }));

    expect(result.direction).toBe('in');
    expect(result.amount).toBe('1200.00');
  });

  it('never emits a signed amount', () => {
    const outgoing = normaliseTransaction(transaction({ amount: 9.99 }));
    const incoming = normaliseTransaction(transaction({ amount: -9.99 }));

    expect(outgoing.amount).toBe(incoming.amount);
  });

  it('falls back to GBP when the provider omits a currency', () => {
    const result = normaliseTransaction(
      transaction({ iso_currency_code: null, unofficial_currency_code: null }),
    );

    expect(result.currency).toBe('GBP');
  });

  it('renders a personal finance category as a readable label', () => {
    const result = normaliseTransaction(
      transaction({
        personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE' },
      }),
    );

    expect(result.category).toBe('Food and drink');
  });

  it('carries the pending flag through so the write path can skip it', () => {
    expect(normaliseTransaction(transaction({ pending: true })).pending).toBe(true);
  });
});

describe('normaliseAccount', () => {
  const account = (overrides: Partial<AccountBase>): AccountBase =>
    ({
      account_id: 'acc_1',
      balances: {
        available: 900.5,
        current: 1000.25,
        limit: null,
        iso_currency_code: 'GBP',
        unofficial_currency_code: null,
      },
      mask: '0000',
      name: 'Business Current',
      official_name: null,
      type: 'depository',
      subtype: 'checking',
      ...overrides,
    }) as AccountBase;

  it('keeps balances at two decimal places', () => {
    const result = normaliseAccount(account({}));

    expect(result.currentBalance).toBe('1000.25');
    expect(result.availableBalance).toBe('900.50');
  });

  it('treats a missing current balance as zero rather than null', () => {
    const result = normaliseAccount(
      account({
        balances: {
          available: null,
          current: null,
          limit: null,
          iso_currency_code: 'GBP',
          unofficial_currency_code: null,
        },
      }),
    );

    expect(result.currentBalance).toBe('0.00');
    expect(result.availableBalance).toBeNull();
  });
});

describe('isCashAccount', () => {
  it('counts a depository account as cash', () => {
    expect(isCashAccount('depository')).toBe(true);
  });

  it('does not count a mortgage or any other loan as cash', () => {
    expect(isCashAccount('loan')).toBe(false);
  });

  it('does not count a credit card as cash', () => {
    expect(isCashAccount('credit')).toBe(false);
  });

  it('does not count an investment holding as cash', () => {
    expect(isCashAccount('investment')).toBe(false);
    expect(isCashAccount('brokerage')).toBe(false);
  });
});
