import type { SaveEventUseCase } from '../application/save-event';

export interface SaveEventHumanUiOptions {
  /** 收藏成功後同步畫面狀態。 */
  readonly onSaveSuccess?: () => Promise<void> | void;
  /** 收藏失敗後顯示使用者可理解的錯誤訊息。 */
  readonly onSaveError?: (message: string) => void;
}

/**
 * 將 UI 的收藏動作交給共用 use case，並保留畫面更新於 UI 邊界。
 */
export function createSaveEventHumanUiHandler(
  useCase: SaveEventUseCase,
  options: SaveEventHumanUiOptions = {}
): (eventId: string) => Promise<void> {
  return async (eventId: string): Promise<void> => {
    const result = await useCase.execute({ eventId });

    if (result.status === 'error') {
      options.onSaveError?.(result.message);

      return;
    }

    await options.onSaveSuccess?.();
  };
}
