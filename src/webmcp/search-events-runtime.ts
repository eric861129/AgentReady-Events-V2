import type { SearchEventsToolOptions } from '../domain/search-events-tool';
import {
  createSearchEventsTool,
  SEARCH_EVENTS_TOOL_NAME
} from './search-events-tool';
import type { ExposedTool, ModelContext } from './types';

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
  private activeRegistration?: AbortController;
  private initializationId = 0;
  private snapshot: SearchEventsRuntimeSnapshot;
  private readonly context: ModelContext | null;
  private readonly toolOptions?: SearchEventsToolOptions;

  constructor({
    context,
    toolOptions
  }: {
    readonly context: ModelContext | null;
    readonly toolOptions?: SearchEventsToolOptions;
  }) {
    this.context = context;
    this.toolOptions = toolOptions;
    this.snapshot = context === null
      ? createUnsupportedSnapshot()
      : {
        availability: 'failed',
        nativeSupport: true,
        registrationStatus: 'WebMCP Tool 註冊或發現流程失敗。',
        discoveredTools: []
      };
  }

  async initialize(): Promise<SearchEventsRuntimeSnapshot> {
    if (this.context === null) {
      this.snapshot = createUnsupportedSnapshot();
      return this.snapshot;
    }

    this.activeRegistration?.abort();
    const registration = new AbortController();
    const currentInitializationId = ++this.initializationId;
    this.activeRegistration = registration;

    try {
      await this.context.registerTool(
        createSearchEventsTool(this.toolOptions),
        { signal: registration.signal }
      );
      const discoveredTools = await this.context.getTools();

      if (currentInitializationId !== this.initializationId) {
        return this.snapshot;
      }

      this.snapshot = {
        availability: 'registered',
        nativeSupport: true,
        registrationStatus: '已透過 document.modelContext 註冊 search_events。',
        discoveredTools
      };
      return this.snapshot;
    } catch (error) {
      if (currentInitializationId !== this.initializationId) {
        return this.snapshot;
      }

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

  async invokeForEvidence(
    input: Record<string, unknown>
  ): Promise<SearchEventsRuntimeSnapshot> {
    if (this.context === null) {
      return this.snapshot;
    }

    try {
      const result = await this.context.executeTool(SEARCH_EVENTS_TOOL_NAME, input);
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
        registrationStatus: 'WebMCP Tool 註冊或發現流程失敗。',
        discoveredTools: this.snapshot.discoveredTools,
        errorMessage: toReadableErrorMessage(error)
      };
      return this.snapshot;
    }
  }

  private async refreshDiscoveredTools(): Promise<readonly ExposedTool[]> {
    try {
      return await this.context!.getTools();
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
