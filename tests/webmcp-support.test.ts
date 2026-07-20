import { describe, expect, it, vi } from 'vitest';
import { isWebMcpSupported, readCurrentTools } from '../src/webmcp/support';
import type { WebMcpRuntimeAdapter } from '../src/webmcp/webmcp-adapter';

describe('WebMCP support detection', () => {
  it('由 adapter 回報瀏覽器是否支援 modelContext', () => {
    expect(isWebMcpSupported(createAdapter(true))).toBe(true);
    expect(isWebMcpSupported(createAdapter(false))).toBe(false);
  });

  it('只從 adapter 讀取目前可用 Tool', async () => {
    const adapter = createAdapter(true, [
      {
        name: 'get_current_event_lab',
        description: '讀取目前查看的活動。',
        inputSchema: '{"type":"object"}'
      }
    ]);

    await expect(readCurrentTools(adapter)).resolves.toEqual([
      {
        name: 'get_current_event_lab',
        description: '讀取目前查看的活動。',
        inputSchema: '{"type":"object"}'
      }
    ]);
    await expect(readCurrentTools(createAdapter(false))).resolves.toEqual([]);
  });
});

function createAdapter(
  supported: boolean,
  tools: readonly { name: string; description: string; inputSchema: string }[] = []
): WebMcpRuntimeAdapter {
  return {
    supported,
    replaceTools: vi.fn().mockResolvedValue(undefined),
    clearTools: vi.fn(),
    getTools: vi.fn().mockResolvedValue(tools),
    executeTool: vi.fn().mockResolvedValue(undefined)
  };
}
