import { describe, expect, it } from 'vitest';

import { monthName, percentageChange, signedPercentage } from './format';

describe('percentageChange', () => {
  it('reports null rather than dividing by a zero previous month', () => {
    expect(percentageChange(100, 0)).toBeNull();
  });

  it('measures a rise and a fall against the earlier month', () => {
    expect(percentageChange(110, 100)).toBe(10);
    expect(percentageChange(50, 100)).toBe(-50);
  });

  it('survives the round trip through the label', () => {
    expect(signedPercentage(percentageChange(11883.47, 11631.47))).toBe('+2.2%');
    expect(signedPercentage(percentageChange(1970, 3940))).toBe('-50%');
  });
});

describe('monthName', () => {
  it('names the month in full, reading the date as UTC', () => {
    expect(monthName('2026-07-01')).toBe('July');
    expect(monthName('2026-01-01')).toBe('January');
  });
});
