/** WebMCP 草案中，本 Lab 實際需要的最小 input schema 形狀。 */
export interface ToolInputSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: readonly string[];
  additionalProperties?: boolean;
}

/** 網頁提供給 WebMCP 的命令式 Tool 定義。 */
export interface WebMcpToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  execute: (input: unknown) => unknown | Promise<unknown>;
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

/** Chrome 目前提供的 WebMCP Imperative API 最小原生介面。 */
export interface NativeModelContext {
  registerTool(tool: WebMcpToolDefinition, options?: { signal?: AbortSignal }): Promise<void>;
  getTools(): Promise<readonly ExposedTool[]>;
  executeTool(tool: ExposedTool, input: string, options?: { signal?: AbortSignal }): Promise<unknown>;
}
