import { describe, expect, it, vi } from 'vitest';
import { getSupportedModelContext, readCurrentTools } from '../src/webmcp/support';
import type { ModelContext } from '../src/webmcp/types';

describe('WebMCP support detection', () => {
  it('回傳瀏覽器實際提供的 modelContext', () => {
    const context = createModelContext();

    expect(getSupportedModelContext({ modelContext: context } as Document)).toBe(context);
  });

  it('瀏覽器未提供 modelContext 時回傳 null', () => {
    expect(getSupportedModelContext({} as Document)).toBeNull();
  });

  it('只從實際提供的 context 讀取目前可用 Tool', async () => {
    const context = createModelContext([
      {
        name: 'get_current_event_lab',
        description: '讀取目前查看的活動。',
        inputSchema: '{"type":"object"}'
      }
    ]);

    await expect(readCurrentTools(context)).resolves.toEqual([
      {
        name: 'get_current_event_lab',
        description: '讀取目前查看的活動。',
        inputSchema: '{"type":"object"}'
      }
    ]);
    await expect(readCurrentTools(null)).resolves.toEqual([]);
  });
});

function createModelContext(tools: readonly { name: string; description: string; inputSchema: string }[] = []): ModelContext {
  return {
    registerTool: vi.fn(),
    getTools: vi.fn().mockResolvedValue(tools)
  };
}
