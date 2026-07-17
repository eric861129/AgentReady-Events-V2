import { describe, expect, it } from 'vitest';
import { searchEvents, toggleSavedEvent } from '../src/domain/events';

describe('searchEvents', () => {
  it('依關鍵字回傳符合名稱或分類的活動', () => {
    const results = searchEvents('前端');

    expect(results.map((event) => event.id)).toEqual(['event-frontend-summit']);
  });

  it('再次收藏同一活動時會取消收藏', () => {
    const savedOnce = toggleSavedEvent([], 'event-frontend-summit');
    const savedTwice = toggleSavedEvent(savedOnce, 'event-frontend-summit');

    expect(savedOnce).toEqual(['event-frontend-summit']);
    expect(savedTwice).toEqual([]);
  });
});
