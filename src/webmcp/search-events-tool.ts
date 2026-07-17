import {
  searchEventsForTool,
  type SearchEventsToolOptions
} from '../domain/search-events-tool';
import type { ModelContextTool } from './types';

export const SEARCH_EVENTS_TOOL_NAME = 'search_events';

export function createSearchEventsTool(
  options?: SearchEventsToolOptions
): ModelContextTool {
  return {
    name: SEARCH_EVENTS_TOOL_NAME,
    description: '搜尋公開活動清單，可依關鍵字、分類與日期找到適合推薦給使用者的活動。',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '必填。用於比對活動名稱、分類、地點與摘要；請提供可讀的關鍵字。'
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
      return JSON.stringify(searchEventsForTool(input, options));
    }
  };
}
