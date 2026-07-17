/** WebMCP 草案中，本 Lab 實際需要的最小 input schema 形狀。 */
export interface ToolInputSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: readonly string[];
}

/** 網頁提供給 WebMCP 的命令式 Tool 定義。 */
export interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
}

/** 瀏覽器揭露給目前文件的 Tool 摘要。 */
export interface ExposedTool {
  name: string;
  description: string;
  inputSchema: string;
}

/** Day 11–12 使用的 WebMCP 草案瀏覽器介面。 */
export interface ModelContext {
  registerTool(tool: ModelContextTool, options?: { signal?: AbortSignal }): Promise<void>;
  getTools(): Promise<readonly ExposedTool[]>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export {};
