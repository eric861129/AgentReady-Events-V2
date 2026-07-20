import { describe, expect, it, vi } from 'vitest';
import { createSavedEventsApi } from '../../src/client/saved-events-api';

const knownEventId = 'event-frontend-summit';

describe('createSavedEventsApi', () => {
  it('所有同源 request 都帶 credentials，收藏 command 不含 userId', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }, 201))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok', eventIds: [knownEventId] }))
      .mockResolvedValueOnce(jsonResponse({
        status: 'ok',
        eventId: knownEventId,
        saved: true,
        changed: true
      }))
      .mockResolvedValueOnce(jsonResponse({
        status: 'ok',
        eventId: knownEventId,
        saved: false,
        changed: true
      }));
    const api = createSavedEventsApi(fetch);

    await api.createDemoSession();
    await api.listSavedEventIds();
    await api.saveEvent(knownEventId);
    await api.removeEvent(knownEventId);

    expect(fetch).toHaveBeenNthCalledWith(1, '/api/demo-session', {
      method: 'POST',
      credentials: 'same-origin'
    });
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/saved-events', {
      method: 'GET',
      credentials: 'same-origin'
    });
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      `/api/saved-events/${knownEventId}`,
      {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId: knownEventId })
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      `/api/saved-events/${knownEventId}`,
      {
        method: 'DELETE',
        credentials: 'same-origin'
      }
    );
    expect(JSON.parse(fetch.mock.calls[2]?.[1]?.body as string)).not.toHaveProperty('userId');
  });

  it('保留 API errorCode，不把 HTTP error 改寫成 client error', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({
      status: 'error',
      errorCode: 'EVENT_NOT_FOUND',
      message: '找不到活動。'
    }, 404));
    const api = createSavedEventsApi(fetch);

    await expect(api.saveEvent('no-such-event')).resolves.toMatchObject({
      status: 'error',
      errorCode: 'EVENT_NOT_FOUND'
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
