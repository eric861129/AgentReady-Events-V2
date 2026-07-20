import { randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from 'node:http';
import { findEventById } from '../../src/domain/event-catalog';
import {
  createDemoSessionStore,
  demoSessionCookieName,
  type DemoPrincipal
} from '../domain/demo-session-store';
import {
  createSavedEventsService,
  EventNotFoundError,
  type SavedEventsService
} from '../domain/saved-events-service';

interface ApiError {
  readonly status: 'error';
  readonly errorCode: string;
  readonly message: string;
}

interface DevApiServerOptions {
  readonly randomUUID?: () => string;
}

class InvalidJsonError extends Error {
  constructor() {
    super('Request body 必須是有效的 JSON。');
    this.name = 'InvalidJsonError';
  }
}

/** 建立只提供同源 Demo session 與收藏能力的 Node HTTP server。 */
export function createDevApiServer(options: DevApiServerOptions = {}): Server {
  const sessionStore = createDemoSessionStore(options.randomUUID ?? randomUUID);
  const savedEventsService = createSavedEventsService({ findEventById });

  return createServer((request, response) => {
    void routeRequest(request, response, sessionStore, savedEventsService);
  });
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  sessionStore: ReturnType<typeof createDemoSessionStore>,
  savedEventsService: SavedEventsService
): Promise<void> {
  try {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (request.method === 'POST' && requestUrl.pathname === '/api/demo-session') {
      const body = await readJsonBody(request);

      if (hasIdentityField(body)) {
        writeApiError(response, 400, 'UNEXPECTED_IDENTITY_FIELD', 'userId 必須由 session 決定。');

        return;
      }

      const session = sessionStore.create();
      response.setHeader(
        'set-cookie',
        `${demoSessionCookieName}=${session.token}; HttpOnly; SameSite=Lax; Path=/`
      );
      writeJson(response, 201, { status: 'ok' });

      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/saved-events') {
      const principal = requirePrincipal(request, response, sessionStore);

      if (principal === undefined) {
        return;
      }

      writeJson(response, 200, {
        status: 'ok',
        eventIds: savedEventsService.list(principal)
      });

      return;
    }

    const savedEventRoute = /^\/api\/saved-events\/([^/]+)$/.exec(requestUrl.pathname);

    if (savedEventRoute !== null && (request.method === 'PUT' || request.method === 'DELETE')) {
      const principal = requirePrincipal(request, response, sessionStore);

      if (principal === undefined) {
        return;
      }

      const eventId = decodeURIComponent(savedEventRoute[1]);

      if (request.method === 'PUT') {
        const body = await readJsonBody(request);

        if (hasIdentityField(body)) {
          writeApiError(response, 400, 'UNEXPECTED_IDENTITY_FIELD', 'userId 必須由 session 決定。');

          return;
        }

        writeJson(response, 200, { status: 'ok', ...savedEventsService.save(principal, eventId) });

        return;
      }

      writeJson(response, 200, { status: 'ok', ...savedEventsService.remove(principal, eventId) });

      return;
    }

    writeApiError(response, 404, 'NOT_FOUND', '找不到指定的 API route。');
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      writeApiError(response, 404, error.errorCode, error.message);

      return;
    }

    if (error instanceof InvalidJsonError) {
      writeApiError(response, 400, 'INVALID_JSON', error.message);

      return;
    }

    writeApiError(response, 500, 'INTERNAL_ERROR', 'Demo API 發生未預期錯誤。');
  }
}

function requirePrincipal(
  request: IncomingMessage,
  response: ServerResponse,
  sessionStore: ReturnType<typeof createDemoSessionStore>
): DemoPrincipal | undefined {
  const principal = sessionStore.getPrincipal(request.headers.cookie);

  if (principal === undefined) {
    writeApiError(response, 401, 'UNAUTHENTICATED', '請先建立 Demo session。');
  }

  return principal;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new InvalidJsonError();
  }
}

function hasIdentityField(body: unknown): boolean {
  return typeof body === 'object'
    && body !== null
    && !Array.isArray(body)
    && Object.prototype.hasOwnProperty.call(body, 'userId');
}

function writeApiError(
  response: ServerResponse,
  statusCode: number,
  errorCode: string,
  message: string
): void {
  const error: ApiError = { status: 'error', errorCode, message };
  writeJson(response, statusCode, error);
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}
