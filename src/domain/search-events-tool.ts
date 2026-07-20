import { events, filterEvents } from './events';
import type { EventCategory, EventItem } from './events';

export type SearchEventsToolInput = {
  readonly query: string;
  readonly category?: EventCategory;
  readonly date?: string;
};

export type SearchEventsToolFailureCode =
  | 'INVALID_ARGUMENT'
  | 'NO_RESULTS'
  | 'TEMPORARY_UNAVAILABLE';

export type SearchEventsToolResultItem = {
  readonly eventId: string;
  readonly title: string;
  readonly category: EventCategory;
  readonly date: string;
  readonly location: string;
  readonly summary: string;
};

export type SearchEventsToolSuccess = {
  readonly status: 'ok';
  readonly appliedFilters: {
    readonly query: string;
    readonly category?: EventCategory;
    readonly date?: string;
  };
  readonly results: readonly SearchEventsToolResultItem[];
};

export type SearchEventsToolFailure = {
  readonly status: 'error';
  readonly errorCode: SearchEventsToolFailureCode;
  readonly message: string;
  readonly guidance: string;
};

export type SearchEventsToolResponse =
  | SearchEventsToolSuccess
  | SearchEventsToolFailure;

export type SearchEventsToolOptions = {
  readonly events?: readonly EventItem[];
  readonly isTemporarilyUnavailable?: () => boolean;
};

const eventCategories: readonly EventCategory[] = events.map((event) => event.category);

const invalidArgumentResponse: SearchEventsToolFailure = {
  status: 'error',
  errorCode: 'INVALID_ARGUMENT',
  message: '搜尋活動需要有效的 query，category 必須是已知分類，date 必須是 YYYY-MM-DD。',
  guidance: '請提供非空白 query；category 可使用「前端、後端、產品、社群」；date 請使用像 2026-08-08 的格式。'
};

const temporarilyUnavailableResponse: SearchEventsToolFailure = {
  status: 'error',
  errorCode: 'TEMPORARY_UNAVAILABLE',
  message: '活動搜尋目前暫時無法使用。',
  guidance: '請稍後再試，或移除受控測試情境後重新呼叫 search_events。'
};

const noResultsResponse: SearchEventsToolFailure = {
  status: 'error',
  errorCode: 'NO_RESULTS',
  message: '找不到符合條件的活動。',
  guidance: '請放寬關鍵字、移除分類或日期限制後再試一次。'
};

export function searchEventsForTool(
  rawInput: unknown,
  options: SearchEventsToolOptions = {}
): SearchEventsToolResponse {
  const input = parseInput(rawInput);

  if (input === null) {
    return invalidArgumentResponse;
  }

  if (options.isTemporarilyUnavailable?.()) {
    return temporarilyUnavailableResponse;
  }

  const results = filterEvents(input, options.events ?? events)
    .map(toToolResultItem);

  if (results.length === 0) {
    return noResultsResponse;
  }

  return {
    status: 'ok',
    appliedFilters: input,
    results
  };
}

function parseInput(rawInput: unknown): SearchEventsToolInput | null {
  if (rawInput === null || typeof rawInput !== 'object' || Array.isArray(rawInput)) {
    return null;
  }

  const { query, category, date } = rawInput as Record<string, unknown>;

  if (typeof query !== 'string' || query.trim().length === 0) {
    return null;
  }

  if (category !== undefined && (!isEventCategory(category) || !eventCategories.includes(category))) {
    return null;
  }

  if (date !== undefined && (typeof date !== 'string' || !isCalendarDate(date))) {
    return null;
  }

  return {
    query: query.trim(),
    ...(category === undefined ? {} : { category }),
    ...(date === undefined ? {} : { date })
  };
}

function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === 'string';
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (match === null) {
    return false;
  }

  const [, year, month, day] = match;
  const candidate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return candidate.getUTCFullYear() === Number(year)
    && candidate.getUTCMonth() === Number(month) - 1
    && candidate.getUTCDate() === Number(day);
}

function toToolResultItem(event: EventItem): SearchEventsToolResultItem {
  return {
    eventId: event.id,
    title: event.title,
    category: event.category,
    date: event.date,
    location: event.location,
    summary: event.summary
  };
}
