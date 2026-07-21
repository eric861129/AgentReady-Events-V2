import { expect, it } from 'vitest';
import { createSearchEventsTool } from '../src/webmcp/search-events-tool';

it('直接執行正式 search_events Tool 時不依賴搜尋按鈕文案', async () => {
  const tool = createSearchEventsTool({
    detailUrlFor: (eventId) => `https://events.example.test/?event=${eventId}`
  });

  const rawToolOutput = await tool.execute({ query: '前端' });

  expect(typeof rawToolOutput).toBe('string');

  if (typeof rawToolOutput !== 'string') {
    throw new Error('正式 search_events Tool 必須回傳可保存的 JSON 字串。');
  }

  expect(JSON.parse(rawToolOutput)).toMatchObject({
    status: 'ok',
    results: [
      {
        eventId: 'event-frontend-summit',
        detailUrl: 'https://events.example.test/?event=event-frontend-summit'
      }
    ]
  });
});
