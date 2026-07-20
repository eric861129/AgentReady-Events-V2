export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'EVENT_NOT_FOUND'
  | 'UNEXPECTED_IDENTITY_FIELD'
  | 'INVALID_JSON'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ApiError {
  readonly status: 'error';
  readonly errorCode: ApiErrorCode;
  readonly message: string;
  readonly guidance?: string;
}

export interface SaveEventSuccess {
  readonly status: 'ok';
  readonly eventId: string;
  readonly saved: true;
  readonly changed: boolean;
}

export interface SavedEventsApi {
  createDemoSession(): Promise<void>;
  listSavedEventIds(): Promise<readonly string[]>;
  saveEvent(eventId: string): Promise<SaveEventSuccess | ApiError>;
  removeEvent(eventId: string): Promise<{
    status: 'ok';
    eventId: string;
    changed: boolean;
  } | ApiError>;
}

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/** 建立只使用同源 cookie，且不接受使用者身分欄位的收藏 API client。 */
export function createSavedEventsApi(fetchImplementation: FetchImplementation): SavedEventsApi {
  return {
    async createDemoSession(): Promise<void> {
      const response = await fetchImplementation('/api/demo-session', {
        method: 'POST',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
    },
    async listSavedEventIds(): Promise<readonly string[]> {
      const response = await fetchImplementation('/api/saved-events', {
        method: 'GET',
        credentials: 'same-origin'
      });
      const body = await readJson(response);

      if (isApiError(body)) {
        throw new Error(body.message);
      }

      return isSavedEventList(body) ? body.eventIds : [];
    },
    async saveEvent(eventId: string): Promise<SaveEventSuccess | ApiError> {
      const command = { eventId };
      const response = await fetchImplementation(
        `/api/saved-events/${encodeURIComponent(eventId)}`,
        {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(command)
        }
      );

      return readJson(response) as Promise<SaveEventSuccess | ApiError>;
    },
    async removeEvent(eventId: string) {
      const response = await fetchImplementation(
        `/api/saved-events/${encodeURIComponent(eventId)}`,
        {
          method: 'DELETE',
          credentials: 'same-origin'
        }
      );

      return readJson(response) as Promise<{
        status: 'ok';
        eventId: string;
        changed: boolean;
      } | ApiError>;
    }
  };
}

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

async function readErrorMessage(response: Response): Promise<string> {
  const body = await readJson(response);

  return isApiError(body) ? body.message : `Demo API request 失敗：HTTP ${response.status}`;
}

function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object'
    && value !== null
    && 'status' in value
    && value.status === 'error'
    && 'message' in value
    && typeof value.message === 'string';
}

function isSavedEventList(value: unknown): value is {
  readonly status: 'ok';
  readonly eventIds: readonly string[];
} {
  return typeof value === 'object'
    && value !== null
    && 'status' in value
    && value.status === 'ok'
    && 'eventIds' in value
    && Array.isArray(value.eventIds)
    && value.eventIds.every((eventId) => typeof eventId === 'string');
}
