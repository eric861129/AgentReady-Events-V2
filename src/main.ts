import { events, searchEvents, toggleSavedEvent, type EventItem } from './domain/events';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (app === null) {
  throw new Error('找不到應用程式根節點。');
}

const appRoot = app;

let activeQuery = '';
let visibleEvents: readonly EventItem[] = events;
let savedEventIds: readonly string[] = [];
let selectedEventId: string | null = null;

function render(): void {
  appRoot.innerHTML = `
    <header class="site-header">
      <a class="brand" href="/">活動探索站</a>
      <p>先讓人類找到活動，再思考 Agent 如何理解網站。</p>
    </header>
    <main class="page-shell">
      <section class="intro" aria-labelledby="page-title">
        <p class="section-label">本系列 Demo</p>
        <h1 id="page-title">探索下一場值得參加的活動</h1>
        <p>這是尚未加入 WebMCP 的人類操作基線。你可以搜尋活動並收藏有興趣的場次。</p>
      </section>
      ${renderWebMcpConceptCard()}
      <form class="search-form" id="event-search-form">
        <label for="event-search">搜尋活動</label>
        <div class="search-controls">
          <input id="event-search" name="query" type="search" value="${escapeHtml(activeQuery)}" placeholder="例如：前端、產品或台北" />
          <button type="submit" data-testid="search-events-button">開始搜尋</button>
        </div>
      </form>
      <section class="event-results" aria-labelledby="event-results-title" aria-live="polite">
        <div class="result-heading">
          <h2 id="event-results-title">活動列表</h2>
          <p>${visibleEvents.length} 場符合條件的活動</p>
        </div>
        <div class="event-grid">
          ${visibleEvents.map(renderEventCard).join('')}
        </div>
      </section>
      ${renderEventDetail()}
    </main>
  `;
}

function renderWebMcpConceptCard(): string {
  return `
    <section class="webmcp-concept" data-testid="webmcp-concept-card" aria-labelledby="webmcp-concept-title">
      <div>
        <p class="section-label">Day 6 概念對照</p>
        <h2 id="webmcp-concept-title">同一個需求，網站可以用兩種方式被理解</h2>
      </div>
      <div class="webmcp-concept__grid">
        <article>
          <h3>人類看見的 UI</h3>
          <p>找到搜尋框、輸入關鍵字、按下按鈕，再從畫面判斷結果。</p>
        </article>
        <article>
          <h3>Agent 需要的能力描述</h3>
          <pre><code>name: search_events
input: { query: string }
result: 活動摘要清單</code></pre>
        </article>
      </div>
      <p class="webmcp-concept__notice">這不是正式 Tool 註冊，也沒有 Agent discovery 或 invocation；它只用來說明 WebMCP 想解決的描述落差。</p>
    </section>
  `;
}

function renderEventCard(event: EventItem): string {
  const isSaved = savedEventIds.includes(event.id);
  const saveLabel = isSaved ? '已收藏' : '收藏活動';

  return `
    <article class="event-card" data-event-id="${event.id}">
      <div class="event-card__meta">
        <span>${event.category}</span>
        <time datetime="${event.date}">${formatDate(event.date)}</time>
      </div>
      <h3>${event.title}</h3>
      <p>${event.summary}</p>
      <p class="event-card__location">${event.location}</p>
      <div class="event-card__actions">
        <button class="event-card__detail" type="button" data-action="detail" data-event-id="${event.id}">查看詳情</button>
        <button type="button" data-action="save" data-event-id="${event.id}">${saveLabel}</button>
      </div>
    </article>
  `;
}

function renderEventDetail(): string {
  const selectedEvent = events.find((event) => event.id === selectedEventId);

  if (selectedEvent === undefined) {
    return '';
  }

  return `
    <div class="dialog-backdrop">
      <section class="event-dialog" role="dialog" aria-modal="true" aria-labelledby="event-dialog-title">
        <button class="dialog-close" type="button" data-action="close-detail" aria-label="關閉詳情">×</button>
        <p class="section-label">${selectedEvent.category}｜${formatDate(selectedEvent.date)}</p>
        <h2 id="event-dialog-title">${selectedEvent.title}</h2>
        <p>${selectedEvent.summary}</p>
        <p class="event-card__location">地點：${selectedEvent.location}</p>
      </section>
    </div>
  `;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };

    return entities[character] ?? character;
  });
}

appRoot.addEventListener('submit', (event) => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'event-search-form') {
    return;
  }

  event.preventDefault();
  const formData = new FormData(event.target);
  activeQuery = String(formData.get('query') ?? '');
  visibleEvents = searchEvents(activeQuery);
  render();
});

appRoot.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-action]') : null;
  const action = button?.dataset.action;
  const eventId = button?.dataset.eventId;

  if (action === 'close-detail') {
    selectedEventId = null;
    render();

    return;
  }

  if (eventId === undefined) {
    return;
  }

  if (action === 'detail') {
    selectedEventId = eventId;
  }

  if (action === 'save') {
    savedEventIds = toggleSavedEvent(savedEventIds, eventId);
  }

  render();
});

render();
