export type EventCategory = '前端' | '後端' | '產品' | '社群';

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  location: string;
  summary: string;
}

export type EventSearchFilters = {
  readonly query: string;
  readonly category?: EventCategory;
  readonly date?: string;
};

export const events: readonly EventItem[] = [
  {
    id: 'event-frontend-summit',
    title: '前端體驗設計小聚',
    category: '前端',
    date: '2026-08-08',
    location: '台北市信義區',
    summary: '從語意、效能到互動細節，重新檢視網頁體驗。'
  },
  {
    id: 'event-api-contract',
    title: 'API 合約與跨團隊協作',
    category: '後端',
    date: '2026-08-15',
    location: '新北市板橋區',
    summary: '用可演進的 API 合約降低前後端整合成本。'
  },
  {
    id: 'event-product-discovery',
    title: '產品探索工作坊',
    category: '產品',
    date: '2026-08-22',
    location: '線上活動',
    summary: '把模糊問題收斂成能驗證的產品假設。'
  },
  {
    id: 'event-community-night',
    title: '工程師社群交流夜',
    category: '社群',
    date: '2026-08-29',
    location: '台中市西區',
    summary: '分享近期實作、失敗經驗與下一步實驗。'
  }
];

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
