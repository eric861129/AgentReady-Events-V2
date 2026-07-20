import { describe, expect, it, vi } from 'vitest';
import { createSaveEventUseCase, type SaveEventUseCase } from '../../src/application/save-event';
import type { SavedEventsApi } from '../../src/client/saved-events-api';
import type { EventRoute } from '../../src/client/event-route';
import type { EventItem } from '../../src/domain/events';
import {
  CurrentEventToolLifecycle,
  GET_EVENT_DETAILS_TOOL_NAME
} from '../../src/webmcp/current-event-tool-lifecycle';
import type { WebMcpAdapter } from '../../src/webmcp/webmcp-adapter';
import type { WebMcpToolDefinition } from '../../src/webmcp/types';

const event: EventItem = {
  id: 'event-frontend-summit',
  title: '前端體驗設計小聚',
  category: '前端',
  date: '2026-08-08',
  location: '台北市信義區',
  summary: '從語意、效能到互動細節，重新檢視網頁體驗。'
};

describe('CurrentEventToolLifecycle', () => {
  it('使用正式的 get_event_details Tool 名稱', () => {
    expect(GET_EVENT_DETAILS_TOOL_NAME).toBe('get_event_details');
  });

  it('每次 replaceTools 都只留下目前 route 可用的 Tool', async () => {
    const { adapter, replacements } = createObservableAdapter();
    const lifecycle = createLifecycle(adapter);

    await lifecycle.sync({ kind: 'search' });
    await lifecycle.sync({ kind: 'detail', eventId: event.id });
    await lifecycle.sync({ kind: 'search' });

    expect(replacements.map(toolNames)).toEqual([
      ['search_events'],
      ['get_event_details', 'save_event'],
      ['search_events']
    ]);
  });

  it('未知活動 route 不註冊任何詳情 Tool', async () => {
    const { adapter, replacements } = createObservableAdapter();
    const lifecycle = createLifecycle(adapter);

    await lifecycle.sync({ kind: 'not-found', eventId: 'event-does-not-exist' });

    expect(replacements.map(toolNames)).toEqual([[]]);
  });

  it('route ID 不吻合時兩個 Tool 都立即回 ROUTE_MISMATCH 且不呼叫 dependency', async () => {
    const { adapter, replacements } = createObservableAdapter();
    const getEventDetails = vi.fn();
    const saveEventUseCase: SaveEventUseCase = { execute: vi.fn() };
    const lifecycle = createLifecycle(adapter, { getEventDetails, saveEventUseCase });
    await lifecycle.sync({ kind: 'detail', eventId: event.id });
    const [getDetailsTool, saveEventTool] = replacements[0] ?? [];

    await expectToolError(getDetailsTool, { eventId: 'event-api-contract' }, 'ROUTE_MISMATCH');
    await expectToolError(saveEventTool, { eventId: 'event-api-contract' }, 'ROUTE_MISMATCH');
    expect(getEventDetails).not.toHaveBeenCalled();
    expect(saveEventUseCase.execute).not.toHaveBeenCalled();
  });

  it('route ID 吻合時讀取活動詳情並執行收藏 use case', async () => {
    const { adapter, replacements } = createObservableAdapter();
    const getEventDetails = vi.fn().mockReturnValue(event);
    const saveEventUseCase: SaveEventUseCase = {
      execute: vi.fn().mockResolvedValue({
        status: 'ok',
        eventId: event.id,
        saved: true,
        changed: true
      })
    };
    const lifecycle = createLifecycle(adapter, { getEventDetails, saveEventUseCase });
    await lifecycle.sync({ kind: 'detail', eventId: event.id });
    const [getDetailsTool, saveEventTool] = replacements[0] ?? [];

    await expectToolResult(getDetailsTool, { eventId: event.id }, {
      status: 'ok',
      event: expect.objectContaining({ eventId: event.id, title: event.title })
    });
    await expectToolResult(saveEventTool, { eventId: event.id }, {
      status: 'ok',
      eventId: event.id,
      saved: true
    });
    expect(getEventDetails).toHaveBeenCalledWith(event.id);
    expect(saveEventUseCase.execute).toHaveBeenCalledWith({ eventId: event.id });
  });

  it('detail 轉 search 時立即讓 stale save handler 失效，不等待延遲 replacement', async () => {
    const routeState: { current: EventRoute } = {
      current: { kind: 'detail', eventId: event.id }
    };
    const api: SavedEventsApi = {
      createDemoSession: vi.fn().mockResolvedValue(undefined),
      listSavedEventIds: vi.fn().mockResolvedValue([]),
      saveEvent: vi.fn().mockResolvedValue({
        status: 'ok',
        eventId: event.id,
        saved: true,
        changed: true
      }),
      removeEvent: vi.fn()
    };
    const saveEventUseCase = createSaveEventUseCase({
      api,
      getCurrentRoute: () => routeState.current.kind === 'detail'
        ? { eventId: routeState.current.eventId }
        : null
    });
    const getEventDetails = vi.fn().mockReturnValue(event);
    const delayed = createDelayedSecondReplacementAdapter();
    const lifecycle = createLifecycle(delayed.adapter, {
      getEventDetails,
      getCurrentRoute: () => routeState.current,
      saveEventUseCase
    });
    await lifecycle.sync(routeState.current);
    const staleDetailsTool = delayed.readActiveTools().find(
      (tool) => tool.name === 'get_event_details'
    );
    const staleSaveTool = delayed.readActiveTools().find((tool) => tool.name === 'save_event');

    routeState.current = { kind: 'search' };
    lifecycle.invalidate();
    const searchSync = lifecycle.sync(routeState.current);
    await vi.waitFor(() => expect(delayed.adapter.replaceTools).toHaveBeenCalledTimes(2));

    expect(delayed.adapter.clearTools).toHaveBeenCalledOnce();
    await expectToolError(staleDetailsTool, { eventId: event.id }, 'ROUTE_MISMATCH');
    await expectToolError(staleSaveTool, { eventId: event.id }, 'ROUTE_MISMATCH');
    expect(getEventDetails).not.toHaveBeenCalled();
    expect(api.saveEvent).not.toHaveBeenCalled();

    delayed.releaseReplacement();
    await searchSync;
    expect(toolNames(delayed.readActiveTools())).toEqual(['search_events']);
  });
});

function createLifecycle(
  adapter: WebMcpAdapter,
  overrides: {
    readonly getEventDetails?: (eventId: string) => EventItem | undefined;
    readonly getCurrentRoute?: () => EventRoute;
    readonly saveEventUseCase?: SaveEventUseCase;
  } = {}
): CurrentEventToolLifecycle {
  return new CurrentEventToolLifecycle({
    adapter,
    createSearchTool: () => createNamedTool('search_events'),
    getEventDetails: overrides.getEventDetails ?? (() => event),
    getCurrentRoute: overrides.getCurrentRoute ?? (() => ({
      kind: 'detail',
      eventId: event.id
    })),
    saveEventUseCase: overrides.saveEventUseCase ?? {
      execute: vi.fn().mockResolvedValue({
        status: 'ok',
        eventId: event.id,
        saved: true,
        changed: true
      })
    }
  });
}

function createDelayedSecondReplacementAdapter(): {
  readonly adapter: WebMcpAdapter;
  readonly readActiveTools: () => readonly WebMcpToolDefinition[];
  readonly releaseReplacement: () => void;
} {
  let activeTools: readonly WebMcpToolDefinition[] = [];
  let replacementCount = 0;
  let releaseReplacement = (): void => {};
  const replacementGate = new Promise<void>((resolve) => {
    releaseReplacement = resolve;
  });
  const adapter: WebMcpAdapter = {
    replaceTools: vi.fn().mockImplementation(async (tools: readonly WebMcpToolDefinition[]) => {
      replacementCount += 1;

      if (replacementCount === 2) {
        await replacementGate;
      }

      activeTools = [...tools];
    }),
    clearTools: vi.fn().mockImplementation(() => {
      activeTools = [];
    })
  };

  return {
    adapter,
    readActiveTools: () => activeTools,
    releaseReplacement
  };
}

function createObservableAdapter(): {
  readonly adapter: WebMcpAdapter;
  readonly replacements: WebMcpToolDefinition[][];
} {
  const replacements: WebMcpToolDefinition[][] = [];

  return {
    replacements,
    adapter: {
      replaceTools: vi.fn().mockImplementation(async (tools: readonly WebMcpToolDefinition[]) => {
        replacements.push([...tools]);
      }),
      clearTools: vi.fn()
    }
  };
}

function createNamedTool(name: string): WebMcpToolDefinition {
  return {
    name,
    description: name,
    inputSchema: { type: 'object' },
    execute: () => '{}'
  };
}

function toolNames(tools: readonly WebMcpToolDefinition[]): string[] {
  return tools.map((tool) => tool.name);
}

async function expectToolError(
  tool: WebMcpToolDefinition | undefined,
  input: unknown,
  errorCode: string
): Promise<void> {
  expect(tool?.name).toBeDefined();
  const result = await tool?.execute(input);
  expect(JSON.parse(result as string)).toMatchObject({ status: 'error', errorCode });
}

async function expectToolResult(
  tool: WebMcpToolDefinition | undefined,
  input: unknown,
  expected: object
): Promise<void> {
  expect(tool?.name).toBeDefined();
  const result = await tool?.execute(input);
  expect(JSON.parse(result as string)).toMatchObject(expected);
}
