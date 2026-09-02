import { describe, expect, it } from 'vitest';

import { percentageChange, projectBalance, runwayLabel } from './runway';

describe('runwayLabel', () => {
  it('renders a dash rather than infinity when there is no burn', () => {
    expect(runwayLabel(null)).toBe('—');
    expect(runwayLabel(0)).toBe('—');
  });

  it('renders days rather than a rounded down zero under a month', () => {
    expect(runwayLabel(1)).toBe('1 day');
    expect(runwayLabel(6)).toBe('6 days');
    expect(runwayLabel(29)).toBe('29 days');
  });

  it('renders months alone under a year', () => {
    expect(runwayLabel(30)).toBe('1 month');
    expect(runwayLabel(90)).toBe('3 months');
  });

  it('renders years and months together', () => {
    expect(runwayLabel(1061)).toBe('2y 11m');
  });
});

describe('percentageChange', () => {
  it('reports null rather than dividing by a zero previous month', () => {
    expect(percentageChange(100, 0)).toBeNull();
  });

  it('rounds to one decimal place', () => {
    expect(percentageChange(110, 100)).toBe(10);
    expect(percentageChange(28524.44, 26000)).toBe(9.7);
  });
});

describe('projectBalance', () => {
  it('runs the curve down to zero rather than stopping short of cash zero', () => {
    const points = projectBalance(210000, 6024.44, new Date('2026-08-01T00:00:00.000Z'));
    const last = points[points.length - 1];

    expect(Number(last?.balance)).toBe(0);
    expect(points.length).toBeGreaterThan(24);
  });

  it('never dips below zero', () => {
    const points = projectBalance(1000, 6000, new Date('2026-08-01T00:00:00.000Z'));

    expect(points.every((point) => Number(point.balance) >= 0)).toBe(true);
  });

  it('draws a flat line when the business is cash positive', () => {
    const points = projectBalance(1000, -500, new Date('2026-08-01T00:00:00.000Z'));

    expect(Number(points[points.length - 1]?.balance)).toBeGreaterThan(1000);
  });
});
