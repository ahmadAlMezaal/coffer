import type { RunwayPoint } from '@coffer/contracts';

const MONTHS_PROJECTED = 60;
const DAYS_IN_MONTH = 30;

export const runwayLabel = (runwayDays: number | null): string => {
  if (runwayDays === null || runwayDays <= 0) {
    return '—';
  }

  if (runwayDays < DAYS_IN_MONTH) {
    return `${runwayDays} day${runwayDays === 1 ? '' : 's'}`;
  }

  const years = Math.floor(runwayDays / 365);
  const months = Math.floor((runwayDays % 365) / DAYS_IN_MONTH);

  if (years === 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  if (months === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }

  return `${years}y ${months}m`;
};

export const percentageChange = (current: number, previous: number): number | null => {
  if (previous === 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
};

export const projectBalance = (
  balance: number,
  monthlyNetBurn: number,
  from: Date,
): RunwayPoint[] => {
  const points: RunwayPoint[] = [];

  for (let month = 0; month <= MONTHS_PROJECTED; month += 1) {
    const at = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + month, 1));
    const projected = balance - monthlyNetBurn * month;

    points.push({
      date: at.toISOString().slice(0, 10),
      balance: Math.max(projected, 0).toFixed(2),
    });

    if (monthlyNetBurn > 0 && projected <= 0) {
      break;
    }
  }

  return points;
};
