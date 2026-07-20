import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  createSearchEventsTool,
  SEARCH_EVENTS_TOOL_NAME,
  type SearchEventsWebMcpToolResultItem
} from '../src/webmcp/search-events-tool';

describe('createSearchEventsTool', () => {
  const detailUrlFor = (eventId: string): string => (
    `https://events.example.test/?event=${eventId}`
  );

  it('formal WebMCP result item 將 detailUrl 宣告為必填 string', () => {
    expectTypeOf<SearchEventsWebMcpToolResultItem>().toMatchTypeOf<{
      readonly detailUrl: string;
    }>();
  });

  it('exposes the formal read-only search_events contract', () => {
    const tool = createSearchEventsTool({ detailUrlFor });

    expect(tool.name).toBe(SEARCH_EVENTS_TOOL_NAME);
    expect(tool.name).toBe('search_events');
    expect(tool.description).toBe('搜尋公開活動清單，可依關鍵字、分類與日期找到適合推薦給使用者的活動。');
    expect(tool.inputSchema).toEqual({
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
    });
    expect(tool.annotations).toEqual({ readOnlyHint: true });
  });

  it('serializes a successful search response as JSON', () => {
    const tool = createSearchEventsTool({ detailUrlFor });
    const response = tool.execute({ query: '前端' });

    expect(typeof response).toBe('string');
    expect(JSON.parse(response as string)).toMatchObject({
      status: 'ok',
      results: [{
        eventId: 'event-frontend-summit',
        detailUrl: 'https://events.example.test/?event=event-frontend-summit'
      }]
    });
  });

  it('serializes invalid input as an INVALID_ARGUMENT JSON response', () => {
    const tool = createSearchEventsTool({ detailUrlFor });
    const response = tool.execute({ query: '' });

    expect(typeof response).toBe('string');
    expect(JSON.parse(response as string)).toMatchObject({
      status: 'error',
      errorCode: 'INVALID_ARGUMENT'
    });
  });
});
