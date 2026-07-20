import type { SaveEventCommand, SaveEventUseCase } from '../application/save-event';
import type { WebMcpToolDefinition } from './types';

export const SAVE_EVENT_TOOL_NAME = 'save_event';

const invalidArgumentResponse = {
  status: 'error',
  errorCode: 'INVALID_ARGUMENT',
  message: 'save_event 只接受非空白的 eventId。',
  guidance: '請使用目前活動詳情 route 顯示的 canonical eventId，且不要夾帶 userId。'
} as const;

export interface SaveEventToolOptions {
  /** 收藏成功後，由呼叫端同步人類可見的 server state。 */
  readonly onSaveSuccess?: () => Promise<void> | void;
}

/** 建立只加入收藏、不提供取消收藏能力的 WebMCP Tool。 */
export function createSaveEventTool(
  useCase: SaveEventUseCase,
  options: SaveEventToolOptions = {}
): WebMcpToolDefinition {
  return {
    name: SAVE_EVENT_TOOL_NAME,
    description: '收藏目前顯示的活動；重複執行安全；若要取消收藏，交由使用者在網站 UI 操作。',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: '目前活動詳情 route 的 canonical eventId。'
        }
      },
      required: ['eventId'],
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: false
    },
    async execute(rawInput) {
      const command = parseSaveEventCommand(rawInput);

      if (command === null) {
        return JSON.stringify(invalidArgumentResponse);
      }

      const result = await useCase.execute(command);

      if (result.status === 'ok') {
        await options.onSaveSuccess?.();
      }

      return JSON.stringify(result);
    }
  };
}

function parseSaveEventCommand(rawInput: unknown): SaveEventCommand | null {
  if (typeof rawInput !== 'object' || rawInput === null || Array.isArray(rawInput)) {
    return null;
  }

  const entries = Object.entries(rawInput);

  if (entries.length !== 1 || entries[0]?.[0] !== 'eventId') {
    return null;
  }

  const eventId = entries[0][1];

  return typeof eventId === 'string' && eventId.trim().length > 0
    ? { eventId: eventId.trim() }
    : null;
}
