import { describe, expect, it } from 'vitest';

import { chartedMonths, comparisonSpan, fillMonths } from './monthly-series';

const august = new Date('2026-08-15T00:00:00.000Z');

describe('chartedMonths', () => {
  it('ends on the month being viewed and reaches back six months', () => {
    expect(chartedMonths(august)).toEqual([
      '2026-03-01',
      '2026-04-01',
      '2026-05-01',
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
    ]);
  });

  it('crosses a year boundary', () => {
    expect(chartedMonths(new Date('2026-02-01T00:00:00.000Z'))[0]).toBe('2025-09-01');
  });
});

describe('fillMonths', () => {
  it('keeps a month the query returned', () => {
    const filled = fillMonths(august, [{ month: '2026-08-01', inflow: 1200.5, outflow: 300 }]);

    expect(filled[5]).toEqual({ month: '2026-08-01', inflow: '1200.50', outflow: '300.00' });
  });

  it('reads a month with no transactions as zero rather than dropping it', () => {
    const filled = fillMonths(august, [{ month: '2026-08-01', inflow: 10, outflow: 0 }]);

    expect(filled).toHaveLength(6);
    expect(filled[0]).toEqual({ month: '2026-03-01', inflow: '0.00', outflow: '0.00' });
  });
});

describe('comparisonSpan', () => {
  it('compares the same run of days in the previous month, not the whole of it', () => {
    const span = comparisonSpan(new Date('2026-09-01T00:00:00.000Z'));

    expect(span.from.toISOString().slice(0, 10)).toBe('2026-08-01');
    expect(span.to.toISOString().slice(0, 10)).toBe('2026-08-01');
    expect(span.monthComplete).toBe(false);
  });

  it('reaches the whole previous month once the current month is complete', () => {
    const span = comparisonSpan(new Date('2026-09-30T00:00:00.000Z'));

    expect(span.from.toISOString().slice(0, 10)).toBe('2026-08-01');
    expect(span.to.toISOString().slice(0, 10)).toBe('2026-08-30');
    expect(span.monthComplete).toBe(true);
  });

  it('clamps to the last day of a shorter previous month', () => {
    const span = comparisonSpan(new Date('2026-03-31T00:00:00.000Z'));

    expect(span.to.toISOString().slice(0, 10)).toBe('2026-02-28');
    expect(span.monthComplete).toBe(true);
  });
});
