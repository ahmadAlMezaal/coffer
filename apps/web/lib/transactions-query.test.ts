import { describe, expect, it } from 'vitest';

import { filtersHref, isFiltered, readFilters } from './transactions-query';

describe('readFilters', () => {
  it('reads a page number from the query string', () => {
    expect(readFilters({ page: '3' }).page).toBe(3);
  });

  it('falls back to the first page when the page is not a whole number above zero', () => {
    expect(readFilters({ page: '0' }).page).toBe(1);
    expect(readFilters({ page: 'two' }).page).toBe(1);
  });

  it('reads a blank value as no filter at all', () => {
    expect(readFilters({ category: '' }).category).toBeUndefined();
  });
});

describe('filtersHref', () => {
  it('leaves the first page out of the address', () => {
    expect(filtersHref({ page: 1, category: 'Travel' })).toBe('/?category=Travel');
  });

  it('carries every filter and the page', () => {
    expect(filtersHref({ page: 2, from: '2026-08-01', to: '2026-08-31' })).toBe(
      '/?from=2026-08-01&to=2026-08-31&page=2',
    );
  });

  it('returns the bare dashboard when nothing is filtered', () => {
    expect(filtersHref({ page: 1 })).toBe('/');
  });
});

describe('isFiltered', () => {
  it('reads a page on its own as unfiltered', () => {
    expect(isFiltered({ page: 4 })).toBe(false);
  });

  it('reads any filter as filtered', () => {
    expect(isFiltered({ page: 1, counterparty: 'uber' })).toBe(true);
  });
});
