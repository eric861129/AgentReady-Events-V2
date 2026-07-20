import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSaveEventUseCase } from '../../src/application/save-event';
import { readEventRoute, type EventRoute } from '../../src/client/event-route';
import { findEventById } from '../../src/domain/event-catalog';
import { createEventDetailUrl } from '../../src/domain/event-detail-url';
import { CurrentEventToolLifecycle } from '../../src/webmcp/current-event-tool-lifecycle';
import { createSearchEventsTool } from '../../src/webmcp/search-events-tool';
import type { WebMcpAdapter } from '../../src/webmcp/webmcp-adapter';
import type { WebMcpToolDefinition } from '../../src/webmcp/types';
import {
  runDay25AgentJourneyTestDouble,
  type Day25JourneyTestDoubleClient
} from '../support/day-25-agent-journey-test-double';

const canonicalEventId = 'event-frontend-summit';
const origin = 'https://events.example.test/';

describe('Day 25 Agent journey adapter fake test-double', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('依序搜尋、導覽 detailUrl、讀取詳情並收藏 canonical 活動', async () => {
    const harness = await createJourneyHarness();

    const result = await runDay25AgentJourneyTestDouble(harness.client, { query: '前端' });

    expect(result).toMatchObject({
      status: 'completed',
      eventId: canonicalEventId,
      detailUrl: `${origin}?event=${canonicalEventId}`,
      saveResult: {
        status: 'ok',
        eventId: canonicalEventId,
        saved: true,
        changed: true
      }
    });
    expect(harness.invocations.map(({ toolName }) => toolName)).toEqual([
      'search_events',
      'get_event_details',
      'save_event'
    ]);
    expect(harness.navigations).toEqual([`${origin}?event=${canonicalEventId}`]);
    expect(harness.saveEvent).toHaveBeenCalledExactlyOnceWith(canonicalEventId);
    expect(result.steps).toEqual([
      expect.objectContaining({
        action: 'invoke',
        toolName: 'search_events',
        input: { query: '前端' },
        availableTools: ['search_events'],
        uiEvidence: expect.arrayContaining([
          '搜尋結果：前端體驗設計小聚',
          `detailUrl：${origin}?event=${canonicalEventId}`
        ])
      }),
      expect.objectContaining({
        action: 'navigate',
        input: { url: `${origin}?event=${canonicalEventId}` },
        output: { currentUrl: `${origin}?event=${canonicalEventId}` },
        availableTools: ['get_event_details', 'save_event'],
        uiEvidence: expect.arrayContaining([
          '活動詳情：前端體驗設計小聚',
          '收藏狀態：尚未收藏'
        ])
      }),
      expect.objectContaining({
        action: 'invoke',
        toolName: 'get_event_details',
        availableTools: ['get_event_details', 'save_event'],
        uiEvidence: expect.arrayContaining(['活動詳情：前端體驗設計小聚'])
      }),
      expect.objectContaining({
        action: 'invoke',
        toolName: 'save_event',
        availableTools: ['get_event_details', 'save_event'],
        uiEvidence: expect.arrayContaining(['收藏狀態：已收藏'])
      })
    ]);
  });

  it('搜尋結果陣列為空時立即停止且不導覽、不呼叫詳情或收藏', async () => {
    const harness = await createJourneyHarness({
      createSearchTool: () => createStaticTool('search_events', {
        status: 'ok',
        results: []
      })
    });

    const result = await runDay25AgentJourneyTestDouble(harness.client, { query: '前端' });

    expect(result).toMatchObject({ status: 'stopped', stopReason: 'EMPTY_RESULTS' });
    expect(harness.invocations.map(({ toolName }) => toolName)).toEqual(['search_events']);
    expect(harness.navigations).toEqual([]);
    expect(harness.saveEvent).not.toHaveBeenCalled();
  });

  it('任一一般 errorCode 出現時立即停止且不猜 ID、不導覽', async () => {
    const harness = await createJourneyHarness();

    const result = await runDay25AgentJourneyTestDouble(harness.client, { query: '不存在' });

    expect(result).toMatchObject({ status: 'stopped', stopReason: 'NO_RESULTS' });
    expect(harness.invocations.map(({ toolName }) => toolName)).toEqual(['search_events']);
    expect(harness.navigations).toEqual([]);
    expect(harness.saveEvent).not.toHaveBeenCalled();
  });

  it('搜尋輸出的 eventId 與 detailUrl route 不一致時停在 ROUTE_MISMATCH 且無收藏副作用', async () => {
    const detailUrl = `${origin}?event=${canonicalEventId}`;
    const harness = await createJourneyHarness({
      createSearchTool: () => createStaticTool('search_events', {
        status: 'ok',
        results: [{
          eventId: 'event-api-contract',
          detailUrl
        }]
      })
    });

    const result = await runDay25AgentJourneyTestDouble(harness.client, { query: '前端' });

    expect(result).toMatchObject({
      status: 'stopped',
      stopReason: 'ROUTE_MISMATCH',
      eventId: 'event-api-contract',
      detailUrl
    });
    expect(harness.navigations).toEqual([detailUrl]);
    expect(harness.currentUrl()).toBe(detailUrl);
    expect(harness.invocations).toEqual([
      { toolName: 'search_events', input: { query: '前端' } },
      { toolName: 'get_event_details', input: { eventId: 'event-api-contract' } }
    ]);
    expect(harness.getEventDetails).not.toHaveBeenCalled();
    expect(harness.saveEvent).not.toHaveBeenCalled();
  });

  it('save_event 回 changed false 時停止而不標示 journey completed', async () => {
    const harness = await createJourneyHarness();
    const client: Day25JourneyTestDoubleClient = {
      ...harness.client,
      async executeTool(toolName, input) {
        const output = await harness.client.executeTool(toolName, input);

        return toolName === 'save_event' ? {
          status: 'ok',
          eventId: canonicalEventId,
          saved: true,
          changed: false
        } : output;
      }
    };

    const result = await runDay25AgentJourneyTestDouble(client, { query: '前端' });

    expect(result).toMatchObject({
      status: 'stopped',
      stopReason: 'SAVE_NOT_CHANGED'
    });
  });

  it('save_event 回 malformed success 時停止而不標示 journey completed', async () => {
    const harness = await createJourneyHarness();
    const client: Day25JourneyTestDoubleClient = {
      ...harness.client,
      async executeTool(toolName, input) {
        const output = await harness.client.executeTool(toolName, input);

        return toolName === 'save_event' ? {
          status: 'ok',
          eventId: canonicalEventId,
          saved: true
        } : output;
      }
    };

    const result = await runDay25AgentJourneyTestDouble(client, { query: '前端' });

    expect(result).toMatchObject({
      status: 'stopped',
      stopReason: 'INVALID_SAVE_RESULT_CONTRACT'
    });
  });
});

async function createJourneyHarness(overrides: {
  readonly createSearchTool?: () => WebMcpToolDefinition;
} = {}): Promise<{
  readonly client: Day25JourneyTestDoubleClient;
  readonly currentUrl: () => string;
  readonly getEventDetails: ReturnType<typeof vi.fn>;
  readonly invocations: Array<{ toolName: string; input: Record<string, unknown> }>;
  readonly navigations: string[];
  readonly saveEvent: ReturnType<typeof vi.fn>;
}> {
  let currentUrl = origin;
  let route: EventRoute = { kind: 'search' };
  let activeTools: readonly WebMcpToolDefinition[] = [];
  const invocations: Array<{ toolName: string; input: Record<string, unknown> }> = [];
  const navigations: string[] = [];
  const getEventDetails = vi.fn(findEventById);
  const saveEvent = vi.fn(async (eventId: string) => ({
    status: 'ok' as const,
    eventId,
    saved: true as const,
    changed: true
  }));
  const adapter: WebMcpAdapter = {
    async replaceTools(tools) {
      activeTools = [...tools];
    },
    clearTools() {
      activeTools = [];
    }
  };
  const lifecycle = new CurrentEventToolLifecycle({
    adapter,
    createSearchTool: overrides.createSearchTool ?? (() => createSearchEventsTool({
      detailUrlFor: (eventId) => createEventDetailUrl(origin, eventId)
    })),
    getCurrentRoute: () => route,
    getEventDetails,
    saveEventUseCase: createSaveEventUseCase({
      api: {
        createDemoSession: vi.fn(),
        listSavedEventIds: vi.fn(),
        saveEvent,
        removeEvent: vi.fn()
      },
      getCurrentRoute: () => route.kind === 'detail' ? { eventId: route.eventId } : null
    })
  });
  await lifecycle.sync(route);

  return {
    currentUrl: () => currentUrl,
    getEventDetails,
    invocations,
    navigations,
    saveEvent,
    client: {
      async executeTool(toolName, input) {
        invocations.push({ toolName, input });
        const tool = activeTools.find((candidate) => candidate.name === toolName);

        if (tool === undefined) {
          throw new Error(`adapter fake 找不到目前 route 的 Tool：${toolName}`);
        }

        const output = await tool.execute(input);
        return typeof output === 'string' ? JSON.parse(output) as unknown : output;
      },
      async navigate(url) {
        navigations.push(url);
        currentUrl = url;
        route = readEventRoute(new URL(url).search);
        lifecycle.invalidate();
        await lifecycle.sync(route);
        return currentUrl;
      },
      async readAvailableTools() {
        return activeTools.map((tool) => tool.name);
      },
      async readUiEvidence() {
        if (route.kind === 'search') {
          return [
            '搜尋結果：前端體驗設計小聚',
            `detailUrl：${origin}?event=${canonicalEventId}`
          ];
        }

        const routeEvent = route.kind === 'detail' ? findEventById(route.eventId) : undefined;

        if (routeEvent === undefined) {
          return [`找不到活動：${route.eventId}`];
        }

        const saveResult = saveEvent.mock.results.at(-1)?.value === undefined
          ? null
          : await saveEvent.mock.results.at(-1)?.value;

        return [
          `活動詳情：${routeEvent.title}`,
          saveResult !== null && isCompletedSaveResult(saveResult)
            ? '收藏狀態：已收藏'
            : '收藏狀態：尚未收藏'
        ];
      }
    }
  };
}

function createStaticTool(name: string, output: unknown): WebMcpToolDefinition {
  return {
    name,
    description: `${name} adapter fake test-double`,
    inputSchema: { type: 'object' },
    execute: () => JSON.stringify(output)
  };
}

function isCompletedSaveResult(value: unknown): boolean {
  return typeof value === 'object'
    && value !== null
    && 'status' in value
    && value.status === 'ok'
    && 'saved' in value
    && value.saved === true
    && 'changed' in value
    && value.changed === true;
}
