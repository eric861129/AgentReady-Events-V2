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
    expect(searchEventsForTool(input)).toEqual({
      status: 'error',
      errorCode: 'INVALID_ARGUMENT',
      message: '搜尋活動需要有效的 query，category 必須是已知分類，date 必須是 YYYY-MM-DD。',
      guidance: '請提供非空白 query；category 可使用「前端、後端、產品、社群」；date 請使用像 2026-08-08 的格式。'
    });
  });

  it('returns NO_RESULTS when no events match', () => {
    expect(searchEventsForTool({ query: 'does-not-exist' })).toEqual({
      status: 'error',
      errorCode: 'NO_RESULTS',
      message: '找不到符合條件的活動。',
      guidance: '請放寬關鍵字、移除分類或日期限制後再試一次。'
    });
  });

  it('returns TEMPORARY_UNAVAILABLE when the source is unavailable', () => {
    expect(searchEventsForTool({ query: events[0].category }, { isTemporarilyUnavailable: () => true })).toEqual({
      status: 'error',
      errorCode: 'TEMPORARY_UNAVAILABLE',
      message: '活動搜尋目前暫時無法使用。',
      guidance: '請稍後再試，或移除受控測試情境後重新呼叫 search_events。'
    });
  });

  it('returns a JSON-serializable success with only approved top-level fields', () => {
    const result = searchEventsForTool({ query: events[0].category });

    expect(Object.keys(result)).toEqual(['status', 'appliedFilters', 'results']);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
