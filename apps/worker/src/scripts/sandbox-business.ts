import type { SandboxCustomUser, SandboxOverrideTransaction } from '@coffer/provider';

const MONTHS_OF_HISTORY = 3;
const CURRENCY = 'GBP';

const RECURRING_OUTFLOWS = [
  { day: 1, amount: 18500, description: 'Payroll, Sterling and Co' },
  { day: 1, amount: 3400, description: 'Rent, Ashworth Estates' },
  { day: 5, amount: 1180.44, description: 'AWS EMEA' },
  { day: 12, amount: 244, description: 'Software subscriptions' },
  { day: 22, amount: 5200, description: 'HMRC PAYE' },
];

const RECURRING_INFLOWS = [
  { day: 10, amount: 14500, description: 'Invoice 0142, Halcyon Retail' },
  { day: 18, amount: 5200, description: 'Invoice 0143, Bramble Foods' },
  { day: 26, amount: 2800, description: 'Invoice 0144, Northwind Labs' },
];

const TRANSFER_AMOUNT = 25000;

const dateOnly = (year: number, month: number, day: number): string =>
  new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);

const entry = (
  year: number,
  month: number,
  day: number,
  amount: number,
  description: string,
): SandboxOverrideTransaction => ({
  date_transacted: dateOnly(year, month, day),
  date_posted: dateOnly(year, month, day),
  amount,
  description,
  currency: CURRENCY,
});

export const businessSandboxUser = (today: Date): SandboxCustomUser => {
  const current: SandboxOverrideTransaction[] = [];
  const savings: SandboxOverrideTransaction[] = [];

  const year = today.getUTCFullYear();

  for (let back = MONTHS_OF_HISTORY; back >= 0; back -= 1) {
    const month = today.getUTCMonth() - back;
    const latestDay = back === 0 ? today.getUTCDate() : 31;

    for (const outflow of RECURRING_OUTFLOWS) {
      if (outflow.day > latestDay) {
        continue;
      }

      current.push(entry(year, month, outflow.day, outflow.amount, outflow.description));
    }

    for (const inflow of RECURRING_INFLOWS) {
      if (inflow.day > latestDay) {
        continue;
      }

      current.push(entry(year, month, inflow.day, -inflow.amount, inflow.description));
    }
  }

  const transferDay = Math.min(15, today.getUTCDate());
  const transferMonth = today.getUTCMonth();

  current.push(
    entry(year, transferMonth, transferDay, TRANSFER_AMOUNT, 'Transfer to Business Reserve'),
  );
  savings.push(
    entry(year, transferMonth, transferDay, -TRANSFER_AMOUNT, 'Transfer from Business Current'),
  );

  return {
    seed: 'coffer-business-001',
    override_accounts: [
      {
        type: 'depository',
        subtype: 'checking',
        starting_balance: 120000,
        currency: CURRENCY,
        meta: { name: 'Business Current', official_name: 'Coffer Business Current Account' },
        transactions: current,
      },
      {
        type: 'depository',
        subtype: 'savings',
        starting_balance: 90000,
        currency: CURRENCY,
        meta: { name: 'Business Reserve', official_name: 'Coffer Business Reserve Account' },
        transactions: savings,
      },
    ],
  };
};
