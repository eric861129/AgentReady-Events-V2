import {
  searchEventsForTool,
  type SearchEventsToolOptions
} from '../domain/search-events-tool';
import type { WebMcpToolDefinition } from './types';

export const SEARCH_EVENTS_TOOL_NAME = 'search_events';

export interface SearchEventsWebMcpToolOptions extends SearchEventsToolOptions {
  /** 將 canonical eventId 映射為目前網站的活動詳情網址。 */
  readonly detailUrlFor: (eventId: string) => string;
}

export function createSearchEventsTool(
  options: SearchEventsWebMcpToolOptions
): WebMcpToolDefinition {
  const { detailUrlFor, ...searchOptions } = options;

  return {
    name: SEARCH_EVENTS_TOOL_NAME,
    description: '搜尋公開活動清單，可依關鍵字、分類與日期找到適合推薦給使用者的活動。',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '使用者想尋找的活動關鍵字，例如「前端」、「API」或「社群」。'
        },
        category: {
          type: 'string',
          enum: ['前端', '後端', '產品', '社群'],
          description: '選填。限制活動分類。'
        },
        date: {
          type: 'string',
          description: '選填。限制活動日期，格式為 YYYY-MM-DD。'
        }
      },
      required: ['query']
    },
    annotations: {
      readOnlyHint: true
    },
    execute(input) {
      const result = searchEventsForTool(input, searchOptions);

      return JSON.stringify(result.status === 'error'
        ? result
        : {
            ...result,
            results: result.results.map((event) => ({
              ...event,
              detailUrl: detailUrlFor(event.eventId)
            }))
          });
    }
  };
}
