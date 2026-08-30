const LONDON = 'Europe/London';

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: LONDON,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const londonToday = (at: Date): { year: number; month: number; day: number } => {
  const parts = formatter.formatToParts(at);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return { year: read('year'), month: read('month'), day: read('day') };
};

export const monthStart = (year: number, month: number): Date =>
  new Date(Date.UTC(year, month - 1, 1));

export const monthEnd = (year: number, month: number): Date => new Date(Date.UTC(year, month, 0));

export const shiftMonth = (year: number, month: number, by: number) => {
  const zeroBased = year * 12 + (month - 1) + by;

  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
};

export const addDays = (at: Date, days: number): Date =>
  new Date(at.getTime() + days * 24 * 60 * 60 * 1000);

export const daysBetween = (left: Date, right: Date): number =>
  Math.abs(left.getTime() - right.getTime()) / (24 * 60 * 60 * 1000);

export const toDateOnly = (at: Date): string => at.toISOString().slice(0, 10);
