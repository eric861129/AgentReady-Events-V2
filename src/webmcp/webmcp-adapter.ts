import type {
  ExposedTool,
  NativeModelContext,
  WebMcpToolDefinition
} from './types';

export interface WebMcpAdapter {
  replaceTools(tools: readonly WebMcpToolDefinition[]): Promise<void>;
  clearTools(): void;
}

export interface WebMcpRuntimeAdapter extends WebMcpAdapter {
  readonly supported: boolean;
  getTools(): Promise<readonly ExposedTool[]>;
  executeTool(tool: ExposedTool, input: string): Promise<unknown>;
}

export class WebMcpUnsupportedError extends Error {
  constructor() {
    super('此瀏覽器尚未提供 document.modelContext，無法註冊原生 WebMCP Tool。');
    this.name = 'WebMcpUnsupportedError';
  }
}

type WebMcpDocument = Document & {
  readonly modelContext?: NativeModelContext;
};

/**
 * 建立唯一接觸 document.modelContext 的 Chrome WebMCP adapter。
 * 原生註冊以 AbortController 管理，手動執行則轉成 tool object 與 JSON 字串。
 */
export function createWebMcpAdapter(document: Document): WebMcpRuntimeAdapter {
  const context = (document as WebMcpDocument).modelContext ?? null;
  let activeRegistration: AbortController | null = null;

  function requireContext(): NativeModelContext {
    if (context === null) {
      throw new WebMcpUnsupportedError();
    }

    return context;
  }

  return {
    supported: context !== null,
    async replaceTools(tools): Promise<void> {
      activeRegistration?.abort();
      const registration = new AbortController();
      activeRegistration = registration;

      try {
        for (const tool of tools) {
          registration.signal.throwIfAborted();
          await requireContext().registerTool(tool, { signal: registration.signal });
        }
      } catch (error) {
        registration.abort();

        if (activeRegistration === registration) {
          activeRegistration = null;
        }

        throw error;
      }
    },
    clearTools(): void {
      activeRegistration?.abort();
      activeRegistration = null;
    },
    async getTools(): Promise<readonly ExposedTool[]> {
      return requireContext().getTools();
    },
    async executeTool(tool, input): Promise<unknown> {
      return requireContext().executeTool(tool, input);
    }
  };
}
