import { describe, expect, it } from 'vitest';
import { readEventRoute } from '../../src/client/event-route';

describe('readEventRoute', () => {
  it('沒有 event query 時回傳搜尋 route', () => {
    expect(readEventRoute('?query=front-end')).toEqual({ kind: 'search' });
  });

  it('canonical eventId 已知時回傳詳情 route', () => {
    expect(readEventRoute('?event=event-frontend-summit')).toEqual({
      kind: 'detail',
      eventId: 'event-frontend-summit'
    });
  });

  it('eventId 未知時回傳 not-found route', () => {
    expect(readEventRoute('?event=event-does-not-exist')).toEqual({
      kind: 'not-found',
      eventId: 'event-does-not-exist'
    });
  });
});
