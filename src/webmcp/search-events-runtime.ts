import type { SearchEventsToolOptions } from '../domain/search-events-tool';
import {
  createSearchEventsTool,
  SEARCH_EVENTS_TOOL_NAME
} from './search-events-tool';
import type { WebMcpRuntimeAdapter } from './webmcp-adapter';
import type { ExposedTool, WebMcpToolDefinition } from './types';

export type SearchEventsRuntimeAvailability =
  | 'unsupported'
  | 'registered'
  | 'failed';

export type SearchEventsRuntimeSnapshot = {
  readonly availability: SearchEventsRuntimeAvailability;
  readonly nativeSupport: boolean;
  readonly registrationStatus: string;
  readonly discoveredTools: readonly ExposedTool[];
  readonly lastInvocation?: {
    readonly input: Record<string, unknown>;
    readonly rawResult: string;
  };
  readonly errorMessage?: string;
};

/** 管理原生 WebMCP search_events Tool 的註冊、發現與呼叫證據。 */
export class SearchEventsRuntime {
  private operationQueue: Promise<void> = Promise.resolve();
  private registrationSucceeded = false;
  private snapshot: SearchEventsRuntimeSnapshot;
  private readonly adapter: WebMcpRuntimeAdapter;
  private readonly detailUrlFor: (eventId: string) => string;
  private readonly toolOptions?: SearchEventsToolOptions;

  constructor({
    adapter,
    detailUrlFor,
    toolOptions
  }: {
    readonly adapter: WebMcpRuntimeAdapter;
    readonly detailUrlFor: (eventId: string) => string;
    readonly toolOptions?: SearchEventsToolOptions;
  }) {
    this.adapter = adapter;
    this.detailUrlFor = detailUrlFor;
    this.toolOptions = toolOptions;
    this.snapshot = !adapter.supported
      ? createUnsupportedSnapshot()
      : {
        availability: 'failed',
        nativeSupport: true,
        registrationStatus: 'WebMCP Tool 註冊或發現流程失敗。',
        discoveredTools: []
      };
  }

  async initialize(): Promise<SearchEventsRuntimeSnapshot> {
    return this.enqueueOperation(() => this.initializeInternal());
  }

  async invokeForEvidence(
    input: Record<string, unknown>
  ): Promise<SearchEventsRuntimeSnapshot> {
    return this.enqueueOperation(() => this.invokeForEvidenceInternal(input));
  }

  async replaceTools(
    tools: readonly WebMcpToolDefinition[]
  ): Promise<SearchEventsRuntimeSnapshot> {
    return this.enqueueOperation(() => this.replaceToolsInternal(tools));
  }

  private async initializeInternal(): Promise<SearchEventsRuntimeSnapshot> {
    return this.replaceToolsInternal([createSearchEventsTool({
      ...this.toolOptions,
      detailUrlFor: this.detailUrlFor
    })]);
  }

  private async replaceToolsInternal(
    tools: readonly WebMcpToolDefinition[]
  ): Promise<SearchEventsRuntimeSnapshot> {
    if (!this.adapter.supported) {
      this.registrationSucceeded = false;
      this.snapshot = createUnsupportedSnapshot();
      return this.snapshot;
    }

    this.registrationSucceeded = false;

    try {
      await this.adapter.replaceTools(tools);
      const discoveredTools = await this.adapter.getTools();
      const toolNames = tools.map((tool) => tool.name);

      this.registrationSucceeded = true;
      this.snapshot = {
        availability: 'registered',
        nativeSupport: true,
        registrationStatus: toolNames.length === 0
          ? '目前 route 不提供 WebMCP Tool。'
          : `已透過 document.modelContext 註冊 ${toolNames.join('、')}。`,
        discoveredTools
      };
      return this.snapshot;
    } catch (error) {
      this.adapter.clearTools();

      this.registrationSucceeded = false;
      this.snapshot = {
        availability: 'failed',
        nativeSupport: true,
        registrationStatus: 'WebMCP Tool 註冊或發現流程失敗。',
        discoveredTools: [],
        errorMessage: toReadableErrorMessage(error)
      };
      return this.snapshot;
    }
  }

  private async invokeForEvidenceInternal(
    input: Record<string, unknown>
  ): Promise<SearchEventsRuntimeSnapshot> {
    if (!this.adapter.supported || !this.registrationSucceeded) {
      return this.snapshot;
    }

    try {
      const tool = this.snapshot.discoveredTools.find(
        (candidate) => candidate.name === SEARCH_EVENTS_TOOL_NAME
      );

      if (tool === undefined) {
        throw new Error(`找不到已發現的 WebMCP Tool：${SEARCH_EVENTS_TOOL_NAME}`);
      }

      const result = await this.adapter.executeTool(tool, JSON.stringify(input));
      const rawResult = typeof result === 'string'
        ? result
        : JSON.stringify(result) ?? 'undefined';
      const discoveredTools = await this.refreshDiscoveredTools();

      this.snapshot = {
        availability: 'registered',
        nativeSupport: true,
        registrationStatus: '已透過 document.modelContext 註冊 search_events。',
        discoveredTools,
        lastInvocation: { input, rawResult }
      };
      return this.snapshot;
    } catch (error) {
      this.snapshot = {
        availability: 'failed',
        nativeSupport: true,
        registrationStatus: 'WebMCP Tool 呼叫流程失敗。',
        discoveredTools: this.snapshot.discoveredTools,
        errorMessage: toReadableErrorMessage(error)
      };
      return this.snapshot;
    }
  }

  private enqueueOperation(
    operation: () => Promise<SearchEventsRuntimeSnapshot>
  ): Promise<SearchEventsRuntimeSnapshot> {
    const result = this.operationQueue.then(operation, operation);
    this.operationQueue = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }

  private async refreshDiscoveredTools(): Promise<readonly ExposedTool[]> {
    try {
      return await this.adapter.getTools();
    } catch {
      return this.snapshot.discoveredTools;
    }
  }
}

function createUnsupportedSnapshot(): SearchEventsRuntimeSnapshot {
  return {
    availability: 'unsupported',
    nativeSupport: false,
    registrationStatus: '此瀏覽器尚未提供 document.modelContext，無法註冊原生 WebMCP Tool。',
    discoveredTools: []
  };
}

function toReadableErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
