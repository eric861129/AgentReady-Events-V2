import { describe, expect, it } from 'vitest';
import { createEventDetailUrl } from '../../src/domain/event-detail-url';

describe('createEventDetailUrl', () => {
  it('只保留 canonical event query 並移除既有 query 與 hash', () => {
    expect(createEventDetailUrl(
      'https://events.example.test/?query=old#old',
      'evt-frontend-2026'
    )).toBe('https://events.example.test/?event=evt-frontend-2026');
  });
});
