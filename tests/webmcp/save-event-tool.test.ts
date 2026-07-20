import { describe, expect, it, vi } from 'vitest';
import { createSaveEventTool, SAVE_EVENT_TOOL_NAME } from '../../src/webmcp/save-event-tool';

const knownEventId = 'event-frontend-summit';

describe('createSaveEventTool', () => {
  it('宣告只收藏目前詳情活動、可安全重複執行，取消收藏交由人類 UI', () => {
    const tool = createSaveEventTool({ execute: vi.fn() });

    expect(tool.name).toBe(SAVE_EVENT_TOOL_NAME);
    expect(tool.name).toBe('save_event');
    expect(tool.description).toBe(
      '收藏目前顯示的活動；重複執行安全；若要取消收藏，交由使用者在網站 UI 操作。'
    );
    expect(tool.inputSchema).toEqual({
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: '目前活動詳情 route 的 canonical eventId。'
        }
      },
      required: ['eventId'],
      additionalProperties: false
    });
    expect(tool.annotations).toEqual({ readOnlyHint: false });
  });

  it('解析合法輸入並序列化 use case 回應', async () => {
    const execute = vi.fn().mockResolvedValue({
      status: 'ok',
      eventId: knownEventId,
      saved: true,
      changed: false
    });
    const tool = createSaveEventTool({ execute });

    await expect(tool.execute({ eventId: knownEventId })).resolves.toBe(JSON.stringify({
      status: 'ok',
      eventId: knownEventId,
      saved: true,
      changed: false
    }));
    expect(execute).toHaveBeenCalledWith({ eventId: knownEventId });
  });

  it.each([
    null,
    {},
    { eventId: '' },
    { eventId: knownEventId, userId: 'admin' }
  ])('拒絕無效或夾帶額外欄位的輸入 %j', async (input) => {
    const execute = vi.fn();
    const tool = createSaveEventTool({ execute });

    const rawResponse = await tool.execute(input as Record<string, unknown>);

    expect(JSON.parse(rawResponse as string)).toMatchObject({
      status: 'error',
      errorCode: 'INVALID_ARGUMENT'
    });
    expect(execute).not.toHaveBeenCalled();
  });
});
