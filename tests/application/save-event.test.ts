import { describe, expect, it, vi } from 'vitest';
import { createSaveEventUseCase } from '../../src/application/save-event';
import type { ApiError, SavedEventsApi, SaveEventSuccess } from '../../src/client/saved-events-api';

const knownEventId = 'event-frontend-summit';

describe('createSaveEventUseCase', () => {
  it('eventId 與目前顯示詳情不符時先回 ROUTE_MISMATCH，完全不發 HTTP', async () => {
    const api = createApi();
    const useCase = createSaveEventUseCase({
      api,
      getCurrentRoute: () => ({ eventId: knownEventId })
    });

    await expect(useCase.execute({ eventId: 'event-api-contract' })).resolves.toMatchObject({
      status: 'error',
      errorCode: 'ROUTE_MISMATCH'
    });
    expect(api.saveEvent).not.toHaveBeenCalled();
  });

  it.each([
    { changed: true },
    { changed: false }
  ])('原樣回傳 saved:true, changed:$changed 的冪等成功結果', async ({ changed }) => {
    const success: SaveEventSuccess = {
      status: 'ok',
      eventId: knownEventId,
      saved: true,
      changed
    };
    const api = createApi(success);
    const useCase = createSaveEventUseCase({
      api,
      getCurrentRoute: () => ({ eventId: knownEventId })
    });

    await expect(useCase.execute({ eventId: knownEventId })).resolves.toEqual(success);
    expect(api.saveEvent).toHaveBeenCalledWith(knownEventId);
  });

  it('未開啟活動詳情時，仍可供人類活動卡 UI 收藏', async () => {
    const success: SaveEventSuccess = {
      status: 'ok',
      eventId: knownEventId,
      saved: true,
      changed: true
    };
    const api = createApi(success);
    const useCase = createSaveEventUseCase({
      api,
      getCurrentRoute: () => null
    });

    await expect(useCase.execute({ eventId: knownEventId })).resolves.toEqual(success);
    expect(api.saveEvent).toHaveBeenCalledWith(knownEventId);
  });

  it.each([
    'UNAUTHENTICATED',
    'EVENT_NOT_FOUND',
    'UNEXPECTED_IDENTITY_FIELD'
  ] as const)('原樣傳遞 API errorCode %s', async (errorCode) => {
    const error: ApiError = {
      status: 'error',
      errorCode,
      message: `API error: ${errorCode}`
    };
    const api = createApi(error);
    const useCase = createSaveEventUseCase({
      api,
      getCurrentRoute: () => ({ eventId: knownEventId })
    });

    await expect(useCase.execute({ eventId: knownEventId })).resolves.toEqual(error);
  });
});

function createApi(result?: SaveEventSuccess | ApiError): SavedEventsApi & {
  saveEvent: ReturnType<typeof vi.fn<SavedEventsApi['saveEvent']>>;
} {
  return {
    createDemoSession: vi.fn().mockResolvedValue(undefined),
    listSavedEventIds: vi.fn().mockResolvedValue([]),
    saveEvent: vi.fn<SavedEventsApi['saveEvent']>().mockResolvedValue(result ?? {
      status: 'ok',
      eventId: knownEventId,
      saved: true,
      changed: true
    }),
    removeEvent: vi.fn().mockResolvedValue({
      status: 'ok',
      eventId: knownEventId,
      changed: false
    })
  };
}
