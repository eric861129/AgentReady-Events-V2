import { describe, expect, it } from 'vitest';
import { createDeclarativeToolPreview } from '../src/labs/declarative-preview';

describe('createDeclarativeToolPreview', () => {
  it('將帶有說明的表單欄位整理成教學用 JSON Schema 預覽', () => {
    const preview = createDeclarativeToolPreview({
      toolname: 'search_events_lab',
      tooldescription: '依關鍵字尋找公開活動。',
      fields: [
        {
          name: 'query',
          type: 'search',
          description: '用於比對公開活動的關鍵字。',
          required: true
        }
      ]
    });

    expect(preview).toEqual({
      name: 'search_events_lab',
      description: '依關鍵字尋找公開活動。',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '用於比對公開活動的關鍵字。'
          }
        },
        required: ['query']
      }
    });
  });

  it('未標示必填的欄位不會出現在 required 陣列', () => {
    const preview = createDeclarativeToolPreview({
      toolname: 'search_events_lab',
      tooldescription: '依關鍵字尋找公開活動。',
      fields: [{ name: 'query', type: 'search', description: '活動關鍵字。', required: false }]
    });

    expect(preview.inputSchema.required).toEqual([]);
  });
});
