import { DEFAULT_CURRENCY } from './config';
import type { AccountBase, Transaction } from 'plaid';
import type { Direction, NormalisedAccount, NormalisedTransaction } from './types';

const toAmount = (value: number): string => Math.abs(value).toFixed(2);

const toDirection = (plaidAmount: number): Direction => {
  if (plaidAmount < 0) {
    return 'in';
  }

  return 'out';
};

const toCategoryLabel = (raw: string | null | undefined): string | null => {
  if (!raw) {
    return null;
  }

  const words = raw.toLowerCase().split('_').join(' ');

  return words.charAt(0).toUpperCase() + words.slice(1);
};

const pickCurrency = (iso: string | null, unofficial: string | null): string =>
  iso ?? unofficial ?? DEFAULT_CURRENCY;

export const normaliseAccount = (account: AccountBase): NormalisedAccount => ({
  providerAccountId: account.account_id,
  name: account.official_name ?? account.name,
  mask: account.mask,
  type: String(account.type),
  subtype: account.subtype === null ? null : String(account.subtype),
  currency: pickCurrency(
    account.balances.iso_currency_code,
    account.balances.unofficial_currency_code,
  ),
  currentBalance: (account.balances.current ?? 0).toFixed(2),
  availableBalance:
    account.balances.available === null ? null : account.balances.available.toFixed(2),
});

export const normaliseTransaction = (transaction: Transaction): NormalisedTransaction => ({
  providerTransactionId: transaction.transaction_id,
  providerAccountId: transaction.account_id,
  amount: toAmount(transaction.amount),
  direction: toDirection(transaction.amount),
  currency: pickCurrency(transaction.iso_currency_code, transaction.unofficial_currency_code),
  bookedAt: transaction.date,
  description: transaction.name,
  merchantName: transaction.merchant_name ?? null,
  category:
    toCategoryLabel(transaction.personal_finance_category?.primary) ??
    toCategoryLabel(transaction.category?.[0]),
  paymentMethod: transaction.payment_channel === null ? null : String(transaction.payment_channel),
  pending: transaction.pending,
});

export const CASH_ACCOUNT_TYPES = ['depository'];

export const isCashAccount = (type: string): boolean => CASH_ACCOUNT_TYPES.includes(type);
