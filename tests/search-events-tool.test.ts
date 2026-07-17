import { describe, expect, it } from 'vitest';
import { events } from '../src/domain/events';
import { searchEventsForTool } from '../src/domain/search-events-tool';

describe('searchEventsForTool', () => {
  it('returns matching events for a query-only search', () => {
    const [frontendEvent] = events;
    const result = searchEventsForTool({ query: frontendEvent.category });

    expect(result).toEqual({
      status: 'ok',
      appliedFilters: { query: frontendEvent.category },
      results: [
        {
          eventId: frontendEvent.id,
          title: frontendEvent.title,
          category: frontendEvent.category,
          date: frontendEvent.date,
          location: frontendEvent.location,
          summary: frontendEvent.summary
        }
      ]
    });
  });

  it('applies an exact category filter', () => {
    const [frontendEvent] = events;
    const result = searchEventsForTool({ query: frontendEvent.category, category: frontendEvent.category });

    expect(result).toMatchObject({
      status: 'ok',
      appliedFilters: { query: frontendEvent.category, category: frontendEvent.category },
      results: [{ eventId: frontendEvent.id, category: frontendEvent.category }]
    });
  });

  it('applies an exact date filter', () => {
    const [frontendEvent] = events;
    const result = searchEventsForTool({ query: frontendEvent.category, date: '2026-08-08' });

    expect(result).toMatchObject({
      status: 'ok',
      appliedFilters: { query: frontendEvent.category, date: '2026-08-08' },
      results: [{ eventId: frontendEvent.id, date: '2026-08-08' }]
    });
  });

  const invalidInputs: readonly [unknown, string][] = [
    [{ query: '   ' }, 'empty query'],
    [{ query: events[0].category, category: 'unknown' }, 'unknown category'],
    [{ query: events[0].category, date: '2026/08/08' }, 'invalid date format'],
    [{ query: events[0].category, date: '2026-02-30' }, 'impossible date']
  ];

  it.each(invalidInputs)('returns INVALID_ARGUMENT for %s', (input) => {
    expect(searchEventsForTool(input)).toMatchObject({
      status: 'error',
      errorCode: 'INVALID_ARGUMENT'
    });
  });

  it('returns NO_RESULTS when no events match', () => {
    expect(searchEventsForTool({ query: 'does-not-exist' })).toMatchObject({
      status: 'error',
      errorCode: 'NO_RESULTS'
    });
  });

  it('returns TEMPORARY_UNAVAILABLE when the source is unavailable', () => {
    expect(searchEventsForTool({ query: events[0].category }, { isTemporarilyUnavailable: () => true })).toMatchObject({
      status: 'error',
      errorCode: 'TEMPORARY_UNAVAILABLE'
    });
  });

  it('returns a JSON-serializable success with only approved top-level fields', () => {
    const result = searchEventsForTool({ query: events[0].category });

    expect(Object.keys(result)).toEqual(['status', 'appliedFilters', 'results']);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
