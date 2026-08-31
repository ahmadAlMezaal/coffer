import { describe, expect, it } from 'vitest';

import { describeRangeProblem } from './date-range';

const today = new Date('2026-08-31T12:00:00.000Z');

describe('describeRangeProblem', () => {
  it('accepts a range that ends today', () => {
    expect(describeRangeProblem({ from: '2026-08-01', to: '2026-08-31' }, today)).toBeNull();
  });

  it('accepts a range with neither end set', () => {
    expect(describeRangeProblem({}, today)).toBeNull();
  });

  it('refuses a range that reaches into the future', () => {
    expect(describeRangeProblem({ from: '2027-02-01', to: '2027-02-21' }, today)).toBe(
      'from cannot be later than today',
    );
  });

  it('refuses an end date in the future on its own', () => {
    expect(describeRangeProblem({ to: '2026-09-01' }, today)).toBe('to cannot be later than today');
  });

  it('refuses a range that runs backwards', () => {
    expect(describeRangeProblem({ from: '2026-08-20', to: '2026-08-01' }, today)).toBe(
      'from cannot be later than to',
    );
  });
});
