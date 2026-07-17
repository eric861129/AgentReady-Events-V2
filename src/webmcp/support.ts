import type { ExposedTool, ModelContext } from './types';

/**
 * 讀取瀏覽器已提供的 WebMCP 介面；未提供時不建立替代實作。
 */
export function getSupportedModelContext(document: Pick<Document, 'modelContext'>): ModelContext | null {
  return document.modelContext ?? null;
}

/**
 * 讀取瀏覽器實際可見的 Tool 清單；空陣列不代表 Agent 已發現或呼叫 Tool。
 */
export async function readCurrentTools(context: ModelContext | null): Promise<readonly ExposedTool[]> {
  if (context === null) {
    return [];
  }

  return context.getTools();
}
