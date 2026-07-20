import type {
  ApiError,
  SavedEventsApi,
  SaveEventSuccess
} from '../client/saved-events-api';

export interface SaveEventCommand {
  readonly eventId: string;
}

export interface RouteMismatchError {
  readonly status: 'error';
  readonly errorCode: 'ROUTE_MISMATCH';
  readonly message: string;
  readonly guidance: string;
}

export type SaveEventResult = SaveEventSuccess | ApiError | RouteMismatchError;

export interface SaveEventUseCase {
  execute(command: SaveEventCommand): Promise<SaveEventResult>;
}

export interface CurrentEventRoute {
  readonly eventId: string;
}

/** 建立先驗證目前詳情狀態，再送出冪等收藏 command 的 use case。 */
export function createSaveEventUseCase(dependencies: {
  readonly api: SavedEventsApi;
  readonly getCurrentRoute: () => CurrentEventRoute | null;
}): SaveEventUseCase {
  return {
    async execute(command: SaveEventCommand): Promise<SaveEventResult> {
      const currentRoute = dependencies.getCurrentRoute();

      if (currentRoute !== null && currentRoute.eventId !== command.eventId) {
        return {
          status: 'error',
          errorCode: 'ROUTE_MISMATCH',
          message: '要求收藏的活動與目前顯示的活動詳情不一致。',
          guidance: '請重新讀取目前活動詳情，並使用該 route 的 eventId。'
        };
      }

      return dependencies.api.saveEvent(command.eventId);
    }
  };
}
