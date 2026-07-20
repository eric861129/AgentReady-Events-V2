import { describe, expect, it } from 'vitest';
import playwrightConfig from '../playwright.config';

describe('normal Playwright browser suite', () => {
  it('以單一 worker 避免固定 demo-reader 的收藏狀態跨測試競態', () => {
    expect(playwrightConfig.workers).toBe(1);
  });
});
