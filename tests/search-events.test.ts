import { describe, expect, it } from 'vitest';
import { searchEvents, toggleSavedEvent } from '../src/domain/events';
import { searchEventsForTool } from '../src/domain/search-events-tool';

describe('searchEvents', () => {
  it('依關鍵字回傳符合名稱或分類的活動', () => {
    const results = searchEvents('前端');

    expect(results.map((event) => event.id)).toEqual(['event-frontend-summit']);
  });

  it('摘要關鍵字在人類搜尋與 Tool 搜尋回傳相同活動', () => {
    const humanEventIds = searchEvents('  效能  ').map((event) => event.id);
    const toolResult = searchEventsForTool({ query: '效能' });

    expect(toolResult.status).toBe('ok');
    expect(humanEventIds).toEqual(['event-frontend-summit']);
    expect(toolResult.status === 'ok'
      ? toolResult.results.map((event) => event.eventId)
      : []).toEqual(humanEventIds);
  });

  it('再次收藏同一活動時會取消收藏', () => {
    const savedOnce = toggleSavedEvent([], 'event-frontend-summit');
    const savedTwice = toggleSavedEvent(savedOnce, 'event-frontend-summit');

    expect(savedOnce).toEqual(['event-frontend-summit']);
    expect(savedTwice).toEqual([]);
  });
});
