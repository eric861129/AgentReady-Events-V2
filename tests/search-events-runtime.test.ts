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

  it('註冊失敗後直接呼叫不會執行 Tool 或改寫失敗狀態', async () => {
    const context = createModelContext({
      registerError: new Error('瀏覽器拒絕註冊 Tool')
    });
    const runtime = new SearchEventsRuntime({ context });
    const failedRegistration = await runtime.initialize();

    const snapshot = await runtime.invokeForEvidence({ query: '前端' });

    expect(context.executeTool).not.toHaveBeenCalled();
    expect(snapshot).toEqual(failedRegistration);
  });

  it('註冊成功但初次發現失敗時中止該次註冊且禁止後續呼叫', async () => {
    const context = createModelContext({
      getToolsError: new Error('瀏覽器拒絕發現 Tool')
    });
    const runtime = new SearchEventsRuntime({ context });

    const failedDiscovery = await runtime.initialize();
    const registrationSignal = vi.mocked(context.registerTool).mock.calls[0]?.[1]?.signal;
    const invocationSnapshot = await runtime.invokeForEvidence({ query: '前端' });

    expect(registrationSignal?.aborted).toBe(true);
    expect(failedDiscovery).toEqual({
      availability: 'failed',
      nativeSupport: true,
      registrationStatus: 'WebMCP Tool 註冊或發現流程失敗。',
      discoveredTools: [],
      errorMessage: '瀏覽器拒絕發現 Tool'
    });
    expect(context.executeTool).not.toHaveBeenCalled();
    expect(invocationSnapshot).toEqual(failedDiscovery);
  });

  it('成功註冊後呼叫失敗時回傳呼叫流程錯誤', async () => {
    const context = createModelContext({
      executeError: new Error('Browser API 拒絕呼叫 Tool')
    });
    const runtime = new SearchEventsRuntime({ context });
    await runtime.initialize();

    await expect(runtime.invokeForEvidence({ query: '前端' })).resolves.toEqual({
      availability: 'failed',
      nativeSupport: true,
      registrationStatus: 'WebMCP Tool 呼叫流程失敗。',
      discoveredTools,
      errorMessage: 'Browser API 拒絕呼叫 Tool'
    });
  });

  it('直接並行 initialize 與 invocation 時由 Runtime 依序完成', async () => {
    const registrationGate = createDeferred();
    const context = createModelContext({ registrationGate: registrationGate.promise });
    const runtime = new SearchEventsRuntime({ context });

    const initialization = runtime.initialize();
    const invocation = runtime.invokeForEvidence({ query: '前端' });
    await vi.waitFor(() => expect(context.registerTool).toHaveBeenCalledOnce());

    expect(context.executeTool).not.toHaveBeenCalled();

    registrationGate.resolve();
    const [initializationSnapshot, invocationSnapshot] = await Promise.all([
      initialization,
      invocation
    ]);

    expect(initializationSnapshot.availability).toBe('registered');
    expect(invocationSnapshot.availability).toBe('registered');
    expect(context.executeTool).toHaveBeenCalledWith('search_events', { query: '前端' });
  });
});

function createModelContext(options: {
  readonly executeResult?: unknown;
  readonly executeError?: Error;
  readonly getToolsError?: Error;
  readonly registerError?: Error;
  readonly registrationGate?: Promise<void>;
} = {}): ModelContext {
  return {
    registerTool: vi.fn().mockImplementation(async () => {
      await options.registrationGate;

      if (options.registerError !== undefined) {
        throw options.registerError;
      }
    }),
    getTools: vi.fn().mockImplementation(async () => {
      if (options.getToolsError !== undefined) {
        throw options.getToolsError;
      }

      return discoveredTools;
    }),
    executeTool: vi.fn().mockImplementation(async () => {
      if (options.executeError !== undefined) {
        throw options.executeError;
      }

      return options.executeResult;
    })
  };
}

function createDeferred(): {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
} {
  let resolve = (): void => {};
  const promise = new Promise<void>((deferredResolve) => {
    resolve = deferredResolve;
  });

  return { promise, resolve };
}
