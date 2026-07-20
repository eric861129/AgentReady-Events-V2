import { describe, expect, it, vi } from 'vitest';
import { createSaveEventHumanUiHandler } from '../../src/ui/save-event-handler';
import { createSaveEventTool } from '../../src/webmcp/save-event-tool';

const knownEventId = 'event-frontend-summit';

describe('SaveEventUseCase callers', () => {
  it('UI and Tool each consume the same SaveEventSuccess once', async () => {
    const success = {
      status: 'ok',
      eventId: knownEventId,
      saved: true,
      changed: false
    } as const;
    const uiExecute = vi.fn().mockResolvedValue(success);
    const toolExecute = vi.fn().mockResolvedValue(success);
    const onSaveSuccess = vi.fn();
    const handler = createSaveEventHumanUiHandler({ execute: uiExecute }, { onSaveSuccess });
    const tool = createSaveEventTool({ execute: toolExecute });

    await handler(knownEventId);
    const rawResult = await tool.execute({ eventId: knownEventId });

    expect(uiExecute).toHaveBeenCalledTimes(1);
    expect(uiExecute).toHaveBeenCalledWith({ eventId: knownEventId });
    expect(toolExecute).toHaveBeenCalledTimes(1);
    expect(toolExecute).toHaveBeenCalledWith({ eventId: knownEventId });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(onSaveSuccess).toHaveBeenCalledWith(success);
    expect(rawResult).toBe(JSON.stringify(success));
  });

  it('UI and Tool each consume the same ApiError once', async () => {
    const apiError = {
      status: 'error',
      errorCode: 'UNAUTHENTICATED',
      message: '請先建立登入狀態。'
    } as const;
    const uiExecute = vi.fn().mockResolvedValue(apiError);
    const toolExecute = vi.fn().mockResolvedValue(apiError);
    const onSaveError = vi.fn();
    const onSaveSuccess = vi.fn();
    const handler = createSaveEventHumanUiHandler({ execute: uiExecute }, { onSaveError, onSaveSuccess });
    const tool = createSaveEventTool({ execute: toolExecute });

    await handler(knownEventId);
    const rawResult = await tool.execute({ eventId: knownEventId });

    expect(uiExecute).toHaveBeenCalledTimes(1);
    expect(uiExecute).toHaveBeenCalledWith({ eventId: knownEventId });
    expect(toolExecute).toHaveBeenCalledTimes(1);
    expect(toolExecute).toHaveBeenCalledWith({ eventId: knownEventId });
    expect(onSaveError).toHaveBeenCalledWith(apiError);
    expect(onSaveSuccess).not.toHaveBeenCalled();
    expect(rawResult).toBe(JSON.stringify(apiError));
  });
});
