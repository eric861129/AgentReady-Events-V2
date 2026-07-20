import { describe, expect, it, vi } from 'vitest';
import { createWebMcpAdapter, WebMcpUnsupportedError } from '../../src/webmcp/webmcp-adapter';
import type { NativeModelContext, WebMcpToolDefinition } from '../../src/webmcp/types';

describe('createWebMcpAdapter', () => {
  it('await 每一個非同步 registerTool，並以同一個 AbortSignal 註冊 replacement', async () => {
    let releaseRegistration = (): void => {};
    const registrationGate = new Promise<void>((resolve) => {
      releaseRegistration = resolve;
    });
    const registerTool = vi.fn().mockImplementation(async () => registrationGate);
    const adapter = createWebMcpAdapter(createDocument(createContext({ registerTool })));
    const replacement = adapter.replaceTools([createTool('search_events'), createTool('save_event')]);

    await Promise.resolve();
    expect(registerTool).toHaveBeenCalledTimes(1);

    releaseRegistration();
    await replacement;

    expect(registerTool).toHaveBeenCalledTimes(2);
    const firstSignal = registerTool.mock.calls[0]?.[1]?.signal as AbortSignal;
    const secondSignal = registerTool.mock.calls[1]?.[1]?.signal as AbortSignal;
    expect(firstSignal).toBe(secondSignal);
    expect(firstSignal.aborted).toBe(false);
  });

  it('replace 與 clear 都會用 AbortController 同步撤銷舊註冊', async () => {
    const registerTool = vi.fn().mockResolvedValue(undefined);
    const adapter = createWebMcpAdapter(createDocument(createContext({ registerTool })));

    await adapter.replaceTools([createTool('search_events')]);
    const firstSignal = registerTool.mock.calls[0]?.[1]?.signal as AbortSignal;
    await adapter.replaceTools([createTool('save_event')]);
    const secondSignal = registerTool.mock.calls[1]?.[1]?.signal as AbortSignal;

    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal.aborted).toBe(false);

    adapter.clearTools();

    expect(secondSignal.aborted).toBe(true);
  });

  it('使用官方 executeTool(tool, jsonString) 呼叫原生 API', async () => {
    const exposedTool = {
      name: 'search_events',
      description: '搜尋活動',
      inputSchema: '{"type":"object"}'
    };
    const executeTool = vi.fn().mockResolvedValue('{"status":"ok"}');
    const adapter = createWebMcpAdapter(createDocument(createContext({
      getTools: vi.fn().mockResolvedValue([exposedTool]),
      executeTool
    })));

    await expect(adapter.executeTool(exposedTool, JSON.stringify({ query: '前端' })))
      .resolves.toBe('{"status":"ok"}');
    expect(executeTool).toHaveBeenCalledWith(exposedTool, JSON.stringify({ query: '前端' }));
  });

  it('未支援 document.modelContext 時回報可診斷的 unsupported error', async () => {
    const adapter = createWebMcpAdapter({} as Document);

    expect(adapter.supported).toBe(false);
    await expect(adapter.replaceTools([createTool('search_events')]))
      .rejects.toBeInstanceOf(WebMcpUnsupportedError);
  });
});

function createTool(name: string): WebMcpToolDefinition {
  return {
    name,
    description: `${name} description`,
    inputSchema: { type: 'object' },
    execute: vi.fn()
  };
}

function createContext(overrides: Partial<NativeModelContext> = {}): NativeModelContext {
  return {
    registerTool: vi.fn().mockResolvedValue(undefined),
    getTools: vi.fn().mockResolvedValue([]),
    executeTool: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function createDocument(modelContext: NativeModelContext): Document {
  return { modelContext } as unknown as Document;
}
