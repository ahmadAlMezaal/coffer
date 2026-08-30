import { describe, expect, it } from 'vitest';

import { chartedMonths, fillMonths } from './monthly-series';

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
