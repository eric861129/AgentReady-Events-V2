import { describe, expect, it, vi } from 'vitest';
import { SearchEventsRuntime } from '../src/webmcp/search-events-runtime';
import type { ExposedTool, ModelContext, ModelContextTool } from '../src/webmcp/types';

const discoveredTools: readonly ExposedTool[] = [
  {
    name: 'search_events',
    description: '搜尋公開活動清單。',
    inputSchema: '{"type":"object"}'
  }
];

describe('SearchEventsRuntime', () => {
  it('未支援時回傳誠實的 unsupported snapshot', async () => {
    const runtime = new SearchEventsRuntime({ context: null });

    await expect(runtime.initialize()).resolves.toEqual({
      availability: 'unsupported',
      nativeSupport: false,
      registrationStatus: '此瀏覽器尚未提供 document.modelContext，無法註冊原生 WebMCP Tool。',
      discoveredTools: []
    });
  });

  it('支援時註冊 search_events 並讀取目前 Tool', async () => {
    const context = createModelContext();
    const runtime = new SearchEventsRuntime({ context });

    const snapshot = await runtime.initialize();

    expect(context.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'search_events' }),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(context.getTools).toHaveBeenCalledOnce();
    expect(snapshot).toMatchObject({
      availability: 'registered',
      nativeSupport: true,
      registrationStatus: '已透過 document.modelContext 註冊 search_events。',
      discoveredTools
    });
  });

  it('將受控暫時失敗選項傳遞給註冊的 Tool factory', async () => {
    const context = createModelContext();
    const runtime = new SearchEventsRuntime({
      context,
      toolOptions: { isTemporarilyUnavailable: () => true }
    });

    await runtime.initialize();

    const registeredTool = vi.mocked(context.registerTool).mock.calls[0]?.[0] as ModelContextTool;
    expect(JSON.parse(registeredTool.execute({ query: '前端' }) as string)).toMatchObject({
      status: 'error',
      errorCode: 'TEMPORARY_UNAVAILABLE'
    });
  });

  it('以原生 executeTool 呼叫 search_events', async () => {
    const context = createModelContext();
    const runtime = new SearchEventsRuntime({ context });
    await runtime.initialize();

    await runtime.invokeForEvidence({ query: '前端' });

    expect(context.executeTool).toHaveBeenCalledWith('search_events', { query: '前端' });
  });

  it('將非字串 invocation 結果保存為 raw JSON string', async () => {
    const context = createModelContext({
      executeResult: { status: 'ok', count: 1 }
    });
    const runtime = new SearchEventsRuntime({ context });
    await runtime.initialize();

    const snapshot = await runtime.invokeForEvidence({ query: '前端' });

    expect(snapshot.lastInvocation).toEqual({
      input: { query: '前端' },
      rawResult: '{"status":"ok","count":1}'
    });
    expect(context.getTools).toHaveBeenCalledTimes(2);
  });

  it('註冊失敗時保留可讀錯誤訊息', async () => {
    const context = createModelContext({
      registerError: new Error('瀏覽器拒絕註冊 Tool')
    });
    const runtime = new SearchEventsRuntime({ context });

    await expect(runtime.initialize()).resolves.toEqual({
      availability: 'failed',
      nativeSupport: true,
      registrationStatus: 'WebMCP Tool 註冊或發現流程失敗。',
      discoveredTools: [],
      errorMessage: '瀏覽器拒絕註冊 Tool'
    });
  });
});

function createModelContext(options: {
  readonly executeResult?: unknown;
  readonly registerError?: Error;
} = {}): ModelContext {
  return {
    registerTool: vi.fn().mockImplementation(async () => {
      if (options.registerError !== undefined) {
        throw options.registerError;
      }
    }),
    getTools: vi.fn().mockResolvedValue(discoveredTools),
    executeTool: vi.fn().mockResolvedValue(options.executeResult)
  };
}
