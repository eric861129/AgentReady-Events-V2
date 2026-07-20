import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDevApiServer } from '../../server/http/dev-api-server';

const knownEventId = 'event-frontend-summit';
const anotherKnownEventId = 'event-api-contract';

describe('Demo API', () => {
  const server = createDevApiServer();
  let baseUrl = '';

  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });

    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error === undefined ? resolve() : reject(error));
    });
  });

  it.each([
    { label: '沒有 cookie', cookie: undefined },
    { label: '無效 session cookie', cookie: 'demo_session=invalid-session-token' }
  ])('$label 時拒絕收藏活動，且 session principal 的資料不變', async ({ cookie }) => {
    const validCookie = await createDemoSession();
    const before = await listSavedEvents(validCookie);
    const response = await putSavedEventResponse(cookie, anotherKnownEventId);

    expect(response.status).toBe(401);
    expect(await errorCodeOf(response)).toBe('UNAUTHENTICATED');
    expect(await listSavedEvents(validCookie)).toEqual(before);
  });

  it('建立 HttpOnly 同源 session，且 token 不能由 client 指定', async () => {
    const response = await fetch(`${baseUrl}/api/demo-session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'client-chosen-token' })
    });
    const cookie = response.headers.get('set-cookie');

    expect(response.status).toBe(201);
    expect(cookie).toMatch(/^demo_session=[^;]+; HttpOnly; SameSite=Lax; Path=\/$/);
    expect(cookie).not.toContain('client-chosen-token');
  });

  it('建立 session 時也拒絕 client 夾帶 userId', async () => {
    const response = await fetch(`${baseUrl}/api/demo-session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'admin' })
    });

    expect(response.status).toBe(400);
    expect(await errorCodeOf(response)).toBe('UNEXPECTED_IDENTITY_FIELD');
  });

  it('PUT 收藏活動具冪等性', async () => {
    const cookie = await createDemoSession();

    expect(await putSavedEvent(cookie, knownEventId)).toMatchObject({
      status: 'ok',
      eventId: knownEventId,
      saved: true,
      changed: true
    });
    expect(await putSavedEvent(cookie, knownEventId)).toMatchObject({ changed: false });
  });

  it('client 只能用有效 session 讀取由該 principal 決定的收藏集合', async () => {
    const cookie = await createDemoSession();
    await putSavedEvent(cookie, knownEventId);
    const authenticated = await listSavedEventsResponse(cookie);

    expect(authenticated.status).toBe(200);
    expect(await authenticated.json()).toMatchObject({
      status: 'ok',
      eventIds: expect.arrayContaining([knownEventId])
    });

    for (const rejectedCookie of [undefined, 'demo_session=invalid-session-token']) {
      const rejected = await listSavedEventsResponse(rejectedCookie);

      expect(rejected.status).toBe(401);
      expect(await errorCodeOf(rejected)).toBe('UNAUTHENTICATED');
    }

    expect(await listSavedEvents(cookie)).toMatchObject({
      status: 'ok',
      eventIds: expect.arrayContaining([knownEventId])
    });
  });

  it('合法 session 收藏未知活動時回傳 404 EVENT_NOT_FOUND，且資料不變', async () => {
    const cookie = await createDemoSession();
    const before = await listSavedEvents(cookie);
    const response = await putSavedEventResponse(cookie, 'no-such-event');

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      status: 'error',
      errorCode: 'EVENT_NOT_FOUND'
    });
    expect(await listSavedEvents(cookie)).toEqual(before);
  });

  it('拒絕 body 夾帶 userId，回傳 400 UNEXPECTED_IDENTITY_FIELD 且資料不變', async () => {
    const cookie = await createDemoSession();
    const before = await listSavedEvents(cookie);
    const response = await putSavedEventResponse(
      cookie,
      anotherKnownEventId,
      { userId: 'another-user' }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      status: 'error',
      errorCode: 'UNEXPECTED_IDENTITY_FIELD'
    });
    expect(await listSavedEvents(cookie)).toEqual(before);
  });

  it('不把 query string 或自訂 header 當成 session 身分', async () => {
    const response = await fetch(
      `${baseUrl}/api/saved-events/${knownEventId}?userId=demo-reader`,
      { method: 'PUT', headers: { 'x-user-id': 'demo-reader' } }
    );

    expect(response.status).toBe(401);
    expect(await errorCodeOf(response)).toBe('UNAUTHENTICATED');
  });

  it('list 與 remove 只使用 session principal', async () => {
    const cookie = await createDemoSession();
    await putSavedEvent(cookie, knownEventId);

    expect(await listSavedEvents(cookie)).toMatchObject({
      status: 'ok',
      eventIds: [knownEventId]
    });
    expect(await removeSavedEvent(cookie, knownEventId)).toMatchObject({
      status: 'ok',
      eventId: knownEventId,
      saved: false,
      changed: true
    });
    expect(await removeSavedEvent(cookie, knownEventId)).toMatchObject({ changed: false });
  });

  it('未知 route 回傳一般 JSON 404', async () => {
    const response = await fetch(`${baseUrl}/api/no-such-route`);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ status: 'error', errorCode: 'NOT_FOUND' });
  });

  async function createDemoSession(): Promise<string> {
    const response = await fetch(`${baseUrl}/api/demo-session`, { method: 'POST' });
    const cookie = response.headers.get('set-cookie');

    expect(response.status).toBe(201);
    expect(cookie).not.toBeNull();

    return cookie!.split(';', 1)[0];
  }

  async function putSavedEvent(
    cookie: string,
    eventId: string,
    body?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await putSavedEventResponse(cookie, eventId, body);

    return response.json() as Promise<Record<string, unknown>>;
  }

  async function putSavedEventResponse(
    cookie: string | undefined,
    eventId: string,
    body?: Record<string, unknown>
  ): Promise<Response> {
    const response = await fetch(`${baseUrl}/api/saved-events/${eventId}`, {
      method: 'PUT',
      headers: {
        ...(cookie === undefined ? {} : { cookie }),
        ...(body === undefined ? {} : { 'content-type': 'application/json' })
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    return response;
  }

  async function listSavedEvents(cookie: string): Promise<Record<string, unknown>> {
    const response = await listSavedEventsResponse(cookie);

    return response.json() as Promise<Record<string, unknown>>;
  }

  async function listSavedEventsResponse(cookie: string | undefined): Promise<Response> {
    return fetch(`${baseUrl}/api/saved-events`, {
      headers: cookie === undefined ? {} : { cookie }
    });
  }

  async function removeSavedEvent(
    cookie: string,
    eventId: string
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`${baseUrl}/api/saved-events/${eventId}`, {
      method: 'DELETE',
      headers: { cookie }
    });

    return response.json() as Promise<Record<string, unknown>>;
  }

  async function errorCodeOf(response: Response): Promise<string | undefined> {
    const body = await response.json() as { errorCode?: string };

    return body.errorCode;
  }
});
