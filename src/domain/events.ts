import { events, type EventCategory, type EventItem } from './event-catalog';

export { events, findEventById, type EventCategory, type EventItem } from './event-catalog';

export type EventSearchFilters = {
  readonly query: string;
  readonly category?: EventCategory;
  readonly date?: string;
};

export function searchEvents(query: string): readonly EventItem[] {
  return filterEvents({ query });
}

/** 套用人類介面與 WebMCP Tool 共用的活動搜尋規則。 */
export function filterEvents(
  filters: EventSearchFilters,
  sourceEvents: readonly EventItem[] = events
): readonly EventItem[] {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase('zh-Hant');

  return sourceEvents.filter((event) => {
    const searchableText = [event.title, event.category, event.location, event.summary]
      .join(' ')
      .toLocaleLowerCase('zh-Hant');

    return (normalizedQuery.length === 0 || searchableText.includes(normalizedQuery))
      && (filters.category === undefined || event.category === filters.category)
      && (filters.date === undefined || event.date === filters.date);
  });
}

export function toggleSavedEvent(savedEventIds: readonly string[], eventId: string): readonly string[] {
  if (savedEventIds.includes(eventId)) {
    return savedEventIds.filter((savedEventId) => savedEventId !== eventId);
  }

  return [...savedEventIds, eventId];
}
