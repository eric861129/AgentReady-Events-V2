import { describe, expect, it, vi } from 'vitest';
import { CurrentEventToolLifecycle } from '../src/labs/current-event-tool';
import type { EventItem } from '../src/domain/events';
import type { ModelContext, ModelContextTool } from '../src/webmcp/types';

const frontendEvent: EventItem = {
  id: 'event-frontend-summit',
  title: '前端體驗設計小聚',
  category: '前端',
  date: '2026-08-08',
  location: '台北市信義區',
  summary: '從語意、效能到互動細節，重新檢視網頁體驗。'
};

describe('CurrentEventToolLifecycle', () => {
  it('只在目前有選取活動時註冊唯讀的詳情 Tool', async () => {
    const registerTool = vi.fn().mockResolvedValue(undefined);
    const lifecycle = new CurrentEventToolLifecycle(createModelContext(registerTool as ModelContext['registerTool']));

    await lifecycle.sync(frontendEvent);

    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'get_current_event_lab',
        annotations: { readOnlyHint: true }
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    const tool = registerTool.mock.calls[0]?.[0] as ModelContextTool;
    await expect(tool.execute({})).resolves.toContain('event-frontend-summit');
  });

  it('離開活動詳情時會中止目前 Tool 的註冊', async () => {
    let signal: AbortSignal | undefined;
    const registerTool = vi.fn().mockImplementation(async (_tool, options: { signal?: AbortSignal }) => {
      signal = options.signal;
    });
    const lifecycle = new CurrentEventToolLifecycle(createModelContext(registerTool as ModelContext['registerTool']));

    await lifecycle.sync(frontendEvent);
    await lifecycle.sync(null);

    expect(signal?.aborted).toBe(true);
  });

  it('瀏覽器未提供 WebMCP 時不會建立替代 Tool', async () => {
    const lifecycle = new CurrentEventToolLifecycle(null);

    await expect(lifecycle.sync(frontendEvent)).resolves.toBeUndefined();
  });
});

function createModelContext(registerTool: ModelContext['registerTool']): ModelContext {
  return {
    registerTool,
    getTools: vi.fn().mockResolvedValue([])
  };
}
