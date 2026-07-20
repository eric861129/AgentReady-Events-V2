import { describe, expect, it, vi } from 'vitest';
import { createSaveEventHumanUiHandler } from '../../src/ui/save-event-handler';
import { createSaveEventTool } from '../../src/webmcp/save-event-tool';

const knownEventId = 'event-frontend-summit';

describe('SaveEventUseCase callers', () => {
  it('UI caller forwards an eventId to the shared use case exactly once', async () => {
    const execute = vi.fn().mockResolvedValue({
      status: 'ok',
      eventId: knownEventId,
      saved: true,
      changed: false
    });
    const onSaveSuccess = vi.fn();
    const handler = createSaveEventHumanUiHandler({ execute }, { onSaveSuccess });

    await handler(knownEventId);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({ eventId: knownEventId });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it('Tool caller forwards an eventId to the shared use case exactly once', async () => {
    const execute = vi.fn().mockResolvedValue({
      status: 'ok',
      eventId: knownEventId,
      saved: true,
      changed: true
    });
    const tool = createSaveEventTool({ execute });

    await tool.execute({ eventId: knownEventId });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({ eventId: knownEventId });
  });

  it('UI caller renders an ApiError returned by the shared use case', async () => {
    const execute = vi.fn().mockResolvedValue({
      status: 'error',
      errorCode: 'UNAUTHENTICATED',
      message: '請先建立登入狀態。'
    });
    const onSaveError = vi.fn();
    const onSaveSuccess = vi.fn();
    const handler = createSaveEventHumanUiHandler({ execute }, { onSaveError, onSaveSuccess });

    await handler(knownEventId);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(onSaveError).toHaveBeenCalledWith('請先建立登入狀態。');
    expect(onSaveSuccess).not.toHaveBeenCalled();
  });
});
