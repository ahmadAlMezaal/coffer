export const money = (amount: string, currency: string): string =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));

export const preciseMoney = (amount: string, currency: string): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(amount));

export const shortDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );

export const relativeTime = (iso: string): string => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.round(hours / 24);

  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const signedPercentage = (value: number | null): string | null => {
  if (value === null) {
    return null;
  }

  const rounded = Math.round(value * 10) / 10;

  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
};

export const monthLabel = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(new Date(iso));

export const monthYearLabel = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso),
  );

export const compactDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(iso),
  );

export const dateRangeLabel = (from: string | undefined, to: string | undefined): string => {
  if (!from && !to) {
    return 'Any date';
  }

  if (from && !to) {
    return `From ${shortDate(from)}`;
  }

  if (!from && to) {
    return `Until ${shortDate(to)}`;
  }

  return `${compactDate(from ?? '')} to ${shortDate(to ?? '')}`;
};
