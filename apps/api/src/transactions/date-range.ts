export type DateRange = {
  from?: string;
  to?: string;
};

export type RangeProblem = string | null;

const dayOf = (value: string): string => value.slice(0, 10);

export const describeRangeProblem = (range: DateRange, today: Date): RangeProblem => {
  const latest = today.toISOString().slice(0, 10);

  if (range.from !== undefined && dayOf(range.from) > latest) {
    return 'from cannot be later than today';
  }

  if (range.to !== undefined && dayOf(range.to) > latest) {
    return 'to cannot be later than today';
  }

  if (range.from !== undefined && range.to !== undefined && dayOf(range.from) > dayOf(range.to)) {
    return 'from cannot be later than to';
  }

  return null;
};
