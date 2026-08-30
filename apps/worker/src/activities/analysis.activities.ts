import { addDays, londonToday, monthEnd, monthStart } from '../domain/calendar';
import { pairInternalTransfers } from '../domain/internal-transfers';
import { computeStats, monthWindows } from '../domain/stats';
import * as accounts from '../repositories/accounts.repository';
import * as consents from '../repositories/consents.repository';
import * as stats from '../repositories/stats.repository';
import * as transactions from '../repositories/transactions.repository';

const TRANSFER_LOOKBACK_DAYS = 180;
const TRAILING_MONTHS = 3;

export const detectInternalTransfers = async (input: { consentId: string }): Promise<number> => {
  const consent = await consents.findForSync(input.consentId);
  const since = addDays(new Date(), -TRANSFER_LOOKBACK_DAYS);
  const candidates = await transactions.listTransferCandidates(consent.userId, since);
  const pairs = pairInternalTransfers(candidates);

  return transactions.markTransferPairs(pairs);
};

export const recomputeStats = async (input: { consentId: string }): Promise<void> => {
  const consent = await consents.findForSync(input.consentId);
  const now = new Date();
  const today = londonToday(now);

  const periodStart = monthStart(today.year, today.month);
  const periodEnd = monthEnd(today.year, today.month);

  const totalBalance = await accounts.totalBalanceForUser(consent.userId);
  const currentMonth = await transactions.monthTotals(consent.userId, periodStart, periodEnd);

  const trailing = [];

  for (const window of monthWindows(today.year, today.month, TRAILING_MONTHS)) {
    trailing.push(await transactions.monthTotals(consent.userId, window.start, window.end));
  }

  const computed = computeStats({ totalBalance, currentMonth, trailing, today: now });

  await stats.createSnapshot({
    userId: consent.userId,
    periodStart,
    periodEnd,
    totalBalance: computed.totalBalance,
    monthlyInflow: computed.monthlyInflow,
    monthlyOutflow: computed.monthlyOutflow,
    netBurn: computed.netBurn,
    runwayDays: computed.runwayDays,
    cashZeroAt: computed.cashZeroAt,
  });
};
