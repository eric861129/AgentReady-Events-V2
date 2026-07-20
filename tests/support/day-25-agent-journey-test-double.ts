export interface Day25JourneyTestDoubleClient {
  readonly executeTool: (
    toolName: string,
    input: Record<string, unknown>
  ) => Promise<string>;
  readonly navigate: (url: string) => Promise<string>;
  readonly readAvailableTools: () => Promise<readonly string[]>;
  readonly readUiEvidence: () => Promise<readonly string[]>;
}

export type Day25JourneyTestDoubleStep =
  | {
      readonly action: 'invoke';
      readonly toolName: string;
      readonly input: Record<string, unknown>;
      readonly rawOutput: string;
      readonly output: unknown;
      readonly availableTools: readonly string[];
      readonly uiEvidence: readonly string[];
    }
  | {
      readonly action: 'navigate';
      readonly url: string;
      readonly input: { readonly url: string };
      readonly output: { readonly currentUrl: string };
      readonly availableTools: readonly string[];
      readonly uiEvidence: readonly string[];
    };

export interface Day25JourneyTestDoubleResult {
  readonly status: 'completed' | 'stopped';
  readonly stopReason?: string;
  readonly eventId?: string;
  readonly detailUrl?: string;
  readonly saveResult?: unknown;
  readonly steps: readonly Day25JourneyTestDoubleStep[];
}

export interface Day25JourneyTestDoubleAttachment {
  readonly evidenceBoundary: string;
  readonly result: Day25JourneyTestDoubleResult;
}

/**
 * 可重複執行 Day 25 固定路徑的測試驅動器。
 * 這是 adapter fake 使用的 test double，不代表原生 Chrome Agent discovery。
 */
export async function runDay25AgentJourneyTestDouble(
  client: Day25JourneyTestDoubleClient,
  searchInput: Record<string, unknown>
): Promise<Day25JourneyTestDoubleResult> {
  const steps: Day25JourneyTestDoubleStep[] = [];
  const searchResult = await invokeAndRecord(client, steps, 'search_events', searchInput);
  const searchErrorCode = readErrorCode(searchResult);

  if (searchErrorCode !== undefined) {
    return stopped(steps, searchErrorCode);
  }

  const firstResult = readFirstSearchResult(searchResult);

  if (firstResult === null) {
    return stopped(steps, 'EMPTY_RESULTS');
  }

  if (firstResult.eventId === undefined || firstResult.detailUrl === undefined) {
    return stopped(steps, 'INVALID_RESULT_CONTRACT');
  }

  const { eventId, detailUrl } = firstResult;
  const currentUrl = await client.navigate(detailUrl);
  const navigationEvidence = await observe(client);
  steps.push({
    action: 'navigate',
    url: detailUrl,
    input: { url: detailUrl },
    output: { currentUrl },
    ...navigationEvidence
  });

  const detailsResult = await invokeAndRecord(
    client,
    steps,
    'get_event_details',
    { eventId }
  );
  const detailsErrorCode = readErrorCode(detailsResult);

  if (detailsErrorCode !== undefined) {
    return stopped(steps, detailsErrorCode, eventId, detailUrl);
  }

  const saveResult = await invokeAndRecord(client, steps, 'save_event', { eventId });
  const saveErrorCode = readErrorCode(saveResult);

  if (saveErrorCode !== undefined) {
    return stopped(steps, saveErrorCode, eventId, detailUrl);
  }

  const invalidSaveReason = readInvalidSaveReason(saveResult);

  if (invalidSaveReason !== undefined) {
    return stopped(steps, invalidSaveReason, eventId, detailUrl);
  }

  return {
    status: 'completed',
    eventId,
    detailUrl,
    saveResult,
    steps
  };
}

async function invokeAndRecord(
  client: Day25JourneyTestDoubleClient,
  steps: Day25JourneyTestDoubleStep[],
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const rawOutput = await client.executeTool(toolName, input);
  const output = JSON.parse(rawOutput) as unknown;
  const evidence = await observe(client);
  steps.push({ action: 'invoke', toolName, input, rawOutput, output, ...evidence });
  return output;
}

async function observe(client: Day25JourneyTestDoubleClient): Promise<{
  readonly availableTools: readonly string[];
  readonly uiEvidence: readonly string[];
}> {
  const [availableTools, uiEvidence] = await Promise.all([
    client.readAvailableTools(),
    client.readUiEvidence()
  ]);

  return {
    availableTools: [...availableTools],
    uiEvidence: [...uiEvidence]
  };
}

function readErrorCode(value: unknown): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return typeof value.errorCode === 'string' ? value.errorCode : undefined;
}

function readInvalidSaveReason(value: unknown): string | undefined {
  if (
    isRecord(value)
    && value.status === 'ok'
    && value.saved === true
    && value.changed === true
  ) {
    return undefined;
  }

  if (
    isRecord(value)
    && value.status === 'ok'
    && value.saved === true
    && value.changed === false
  ) {
    return 'SAVE_NOT_CHANGED';
  }

  return 'INVALID_SAVE_RESULT_CONTRACT';
}

function readFirstSearchResult(value: unknown): {
  readonly eventId?: string;
  readonly detailUrl?: string;
} | null {
  if (!isRecord(value) || !Array.isArray(value.results) || value.results.length === 0) {
    return null;
  }

  const firstResult = value.results[0];

  if (!isRecord(firstResult)) {
    return {};
  }

  return {
    eventId: typeof firstResult.eventId === 'string' ? firstResult.eventId : undefined,
    detailUrl: typeof firstResult.detailUrl === 'string' ? firstResult.detailUrl : undefined
  };
}

function stopped(
  steps: readonly Day25JourneyTestDoubleStep[],
  stopReason: string,
  eventId?: string,
  detailUrl?: string
): Day25JourneyTestDoubleResult {
  return {
    status: 'stopped',
    stopReason,
    eventId,
    detailUrl,
    steps
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
