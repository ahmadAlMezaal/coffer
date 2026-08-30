import { describe, expect, it } from 'vitest';

import { computeStats, monthWindows } from './stats';

const today = new Date('2026-08-30T00:00:00.000Z');

describe('computeStats', () => {
  it('averages net burn over the three trailing months', () => {
    const result = computeStats({
      totalBalance: 120000,
      currentMonth: { inflow: 22500, outflow: 28524.44 },
      trailing: [
        { inflow: 20000, outflow: 26000 },
        { inflow: 20000, outflow: 26000 },
        { inflow: 20000, outflow: 32000 },
      ],
      today,
    });

    expect(result.netBurn).toBe(8000);
  });

  it('reports no runway when the business is cash positive', () => {
    const result = computeStats({
      totalBalance: 120000,
      currentMonth: { inflow: 40000, outflow: 10000 },
      trailing: [
        { inflow: 40000, outflow: 10000 },
        { inflow: 40000, outflow: 10000 },
        { inflow: 40000, outflow: 10000 },
      ],
      today,
    });

    expect(result.runwayDays).toBeNull();
    expect(result.cashZeroAt).toBeNull();
  });

  it('falls back to the current month when there is no trailing history', () => {
    const result = computeStats({
      totalBalance: 60000,
      currentMonth: { inflow: 10000, outflow: 16000 },
      trailing: [
        { inflow: 0, outflow: 0 },
        { inflow: 0, outflow: 0 },
        { inflow: 0, outflow: 0 },
      ],
      today,
    });

    expect(result.netBurn).toBe(6000);
    expect(result.runwayDays).toBe(304);
  });

  it('dates cash zero from the runway it just computed', () => {
    const result = computeStats({
      totalBalance: 6000,
      currentMonth: { inflow: 0, outflow: 6000 },
      trailing: [
        { inflow: 0, outflow: 6000 },
        { inflow: 0, outflow: 6000 },
        { inflow: 0, outflow: 6000 },
      ],
      today,
    });

    expect(result.runwayDays).toBe(30);
    expect(result.cashZeroAt?.toISOString().slice(0, 10)).toBe('2026-09-29');
  });
});

describe('monthWindows', () => {
  it('returns the three complete months before the one given, most recent first', () => {
    const windows = monthWindows(2026, 8, 3);

    expect(windows.map((window) => window.start.toISOString().slice(0, 10))).toEqual([
      '2026-07-01',
      '2026-06-01',
      '2026-05-01',
    ]);
    expect(windows[0]?.end.toISOString().slice(0, 10)).toBe('2026-07-31');
  });

  it('crosses a year boundary', () => {
    const windows = monthWindows(2026, 2, 3);

    expect(windows.map((window) => window.start.toISOString().slice(0, 10))).toEqual([
      '2026-01-01',
      '2025-12-01',
      '2025-11-01',
    ]);
  });
});
