import type { SaveEventUseCase } from '../application/save-event';
import type { EventRoute } from '../client/event-route';
import type { EventItem } from '../domain/events';
import { createSaveEventTool } from './save-event-tool';
import type { WebMcpAdapter } from './webmcp-adapter';
import type { WebMcpToolDefinition } from './types';

export const GET_EVENT_DETAILS_TOOL_NAME = 'get_event_details';

const routeMismatchResponse = {
  status: 'error',
  errorCode: 'ROUTE_MISMATCH',
  message: '要求的活動與目前頁面顯示的活動詳情不一致。',
  guidance: '請重新讀取目前 route，並使用該 route 的 eventId。'
} as const;

export interface CurrentEventToolLifecycleDependencies {
  readonly adapter: WebMcpAdapter;
  readonly createSearchTool: () => WebMcpToolDefinition;
  readonly getCurrentRoute: () => EventRoute;
  readonly getEventDetails: (eventId: string) => EventItem | undefined | Promise<EventItem | undefined>;
  readonly saveEventUseCase: SaveEventUseCase;
  readonly onSaveSuccess?: () => Promise<void> | void;
}

/** 依目前活動 route 替換文件所暴露的正式 WebMCP Tool。 */
export class CurrentEventToolLifecycle {
  private generation = 0;

  public constructor(private readonly dependencies: CurrentEventToolLifecycleDependencies) {}

  /** route 一變更就同步失效舊 handler，不等待非同步 replacement queue。 */
  public invalidate(): void {
    this.generation += 1;
    this.dependencies.adapter.clearTools();
  }

  public async sync(route: EventRoute): Promise<void> {
    if (route.kind === 'search') {
      await this.dependencies.adapter.replaceTools([
        this.dependencies.createSearchTool()
      ]);

      return;
    }

    if (route.kind === 'not-found') {
      await this.dependencies.adapter.replaceTools([]);

      return;
    }

    const generation = this.generation;
    const isCurrentRoute = (): boolean => (
      generation === this.generation
      && isCurrentDetailRoute(this.dependencies.getCurrentRoute(), route.eventId)
    );

    await this.dependencies.adapter.replaceTools([
      createGetEventDetailsTool(
        route.eventId,
        this.dependencies.getEventDetails,
        isCurrentRoute
      ),
      createRouteScopedSaveEventTool(
        route.eventId,
        this.dependencies.saveEventUseCase,
        isCurrentRoute,
        this.dependencies.onSaveSuccess
      )
    ]);
  }
}

function createGetEventDetailsTool(
  routeEventId: string,
  getEventDetails: CurrentEventToolLifecycleDependencies['getEventDetails'],
  isCurrentRoute: () => boolean
): WebMcpToolDefinition {
  return {
    name: GET_EVENT_DETAILS_TOOL_NAME,
    description: '讀取目前活動詳情 route 顯示的 canonical 活動資料。',
    inputSchema: createEventIdInputSchema(),
    annotations: { readOnlyHint: true },
    async execute(input) {
      if (!isCurrentRoute() || !matchesRoute(input, routeEventId)) {
        return JSON.stringify(routeMismatchResponse);
      }

      const event = await getEventDetails(routeEventId);

      if (event === undefined) {
        return JSON.stringify({
          status: 'error',
          errorCode: 'EVENT_NOT_FOUND',
          message: '找不到目前 route 指定的活動。',
          guidance: '請返回搜尋頁重新選擇活動。'
        });
      }

      return JSON.stringify({
        status: 'ok',
        event: {
          eventId: event.id,
          title: event.title,
          category: event.category,
          date: event.date,
          location: event.location,
          summary: event.summary
        }
      });
    }
  };
}

function createRouteScopedSaveEventTool(
  routeEventId: string,
  useCase: SaveEventUseCase,
  isCurrentRoute: () => boolean,
  onSaveSuccess?: () => Promise<void> | void
): WebMcpToolDefinition {
  const saveEventTool = createSaveEventTool(useCase, { onSaveSuccess });

  return {
    ...saveEventTool,
    async execute(input) {
      if (!isCurrentRoute() || !matchesRoute(input, routeEventId)) {
        return JSON.stringify(routeMismatchResponse);
      }

      return saveEventTool.execute(input);
    }
  };
}

function createEventIdInputSchema(): WebMcpToolDefinition['inputSchema'] {
  return {
    type: 'object',
    properties: {
      eventId: {
        type: 'string',
        description: '目前活動詳情 route 的 canonical eventId。'
      }
    },
    required: ['eventId'],
    additionalProperties: false
  };
}

function matchesRoute(input: unknown, routeEventId: string): boolean {
  return typeof input === 'object'
    && input !== null
    && !Array.isArray(input)
    && (input as Record<string, unknown>).eventId === routeEventId;
}

function isCurrentDetailRoute(route: EventRoute, eventId: string): boolean {
  return route.kind === 'detail' && route.eventId === eventId;
}
