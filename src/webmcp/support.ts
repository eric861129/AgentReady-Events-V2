import type { WebMcpRuntimeAdapter } from './webmcp-adapter';
import type { ExposedTool } from './types';

/** adapter 是否觀測到原生 WebMCP 介面；不建立替代實作。 */
export function isWebMcpSupported(adapter: WebMcpRuntimeAdapter): boolean {
  return adapter.supported;
}

/**
 * 讀取瀏覽器實際可見的 Tool 清單；空陣列不代表 Agent 已發現或呼叫 Tool。
 */
export async function readCurrentTools(
  adapter: WebMcpRuntimeAdapter
): Promise<readonly ExposedTool[]> {
  if (!adapter.supported) {
    return [];
  }

  return adapter.getTools();
}
