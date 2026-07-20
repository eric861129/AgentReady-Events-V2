/// <reference types="vite/client" />

import { events, searchEvents, type EventItem } from './domain/events';
import { createSaveEventUseCase } from './application/save-event';
import { readEventRoute } from './client/event-route';
import { createSavedEventsApi } from './client/saved-events-api';
import { createEventDetailUrl } from './domain/event-detail-url';
import { findEventById } from './domain/event-catalog';
import { createDeclarativeToolPreview, type DeclarativeToolDefinition } from './labs/declarative-preview';
import { createSaveEventHumanUiHandler } from './ui/save-event-handler';
import { CurrentEventToolLifecycle } from './webmcp/current-event-tool-lifecycle';
import { SearchEventsRuntime, type SearchEventsRuntimeSnapshot } from './webmcp/search-events-runtime';
import { createSearchEventsTool } from './webmcp/search-events-tool';
import { createWebMcpAdapter, type WebMcpAdapter } from './webmcp/webmcp-adapter';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (app === null) {
  throw new Error('找不到應用程式根節點。');
}

const appRoot = app;
const webMcpAdapter = createWebMcpAdapter(document);
const savedEventsApi = createSavedEventsApi(window.fetch.bind(window));
let eventRoute = readEventRoute(window.location.search);
const detailUrlFor = (eventId: string): string => createEventDetailUrl(window.location.href, eventId);
const temporaryFailureEvidenceScenario =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('evidenceScenario') === 'temporary-unavailable';
const searchEventsRuntime = new SearchEventsRuntime({
  adapter: webMcpAdapter,
  detailUrlFor,
  toolOptions: {
    isTemporarilyUnavailable: () => temporaryFailureEvidenceScenario
  }
});
const saveEventUseCase = createSaveEventUseCase({
  api: savedEventsApi,
  getCurrentRoute: () => eventRoute.kind === 'detail' ? { eventId: eventRoute.eventId } : null
});
const saveEventFromHumanUi = createSaveEventHumanUiHandler(saveEventUseCase, {
  onSaveSuccess: async () => {
    lastRemovedEventId = null;
    await synchronizeSavedEvents();
  },
  onSaveError: (result) => {
    savedEventsError = result.message;
    render();
  }
});

let activeQuery = '';
let visibleEvents: readonly EventItem[] = events;
let savedEventIds: readonly string[] = [];
let savedEventsError: string | null = null;
let lastRemovedEventId: string | null = null;
let searchEventsRuntimeSnapshot: SearchEventsRuntimeSnapshot | null = null;
let nativeToolQuery = '前端';
let searchEventsRuntimeOperation: Promise<void> = Promise.resolve();
const lifecycleAdapter: WebMcpAdapter = {
  async replaceTools(tools): Promise<void> {
    searchEventsRuntimeSnapshot = await searchEventsRuntime.replaceTools(tools);
  },
  clearTools(): void {
    webMcpAdapter.clearTools();
  }
};
const currentEventToolLifecycle = new CurrentEventToolLifecycle({
  adapter: lifecycleAdapter,
  createSearchTool: () => createSearchEventsTool({
    detailUrlFor,
    isTemporarilyUnavailable: () => temporaryFailureEvidenceScenario
  }),
  getCurrentRoute: () => eventRoute,
  getEventDetails: findEventById,
  saveEventUseCase,
  onSaveSuccess: synchronizeSavedEventsAfterToolInvocation
});

const declarativeSearchLabDefinition: DeclarativeToolDefinition = {
  toolname: 'search_events_lab',
  tooldescription: '依關鍵字尋找公開活動。這是 Day 11 的宣告式練習，不是正式搜尋 Tool。',
  fields: [
    {
      name: 'query',
      type: 'search',
      description: '用於比對公開活動的關鍵字。',
      required: true
    }
  ]
};

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
        <p>這是供人類搜尋與收藏活動的操作基線。你可以搜尋活動並收藏有興趣的場次。</p>
      </section>
      ${renderWebMcpConceptCard()}
      ${renderWebMcpRuntimePanel()}
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
      ${renderSavedEventsList()}
      ${renderDeclarativeSearchLab()}
      ${renderEventDetail()}
    </main>
  `;

}

function renderWebMcpRuntimePanel(): string {
  const hasNativeSupport = searchEventsRuntimeSnapshot?.nativeSupport ?? webMcpAdapter.supported;
  const registrationStatus = searchEventsRuntimeSnapshot?.registrationStatus ?? '正在初始化 WebMCP runtime。';
  const discoveredTools = searchEventsRuntimeSnapshot?.discoveredTools ?? [];
  const toolNames = discoveredTools.map((tool) => `<li><code>${escapeHtml(tool.name)}</code></li>`).join('');
  const lastInvocation = searchEventsRuntimeSnapshot?.lastInvocation;
  const runtimeError = searchEventsRuntimeSnapshot?.errorMessage;

  return `
    <section class="webmcp-runtime-panel" data-testid="webmcp-runtime-panel" aria-labelledby="webmcp-runtime-title">
      <p class="section-label">Day 15｜Browser runtime observation</p>
      <h2 id="webmcp-runtime-title">原生 WebMCP 證據面板</h2>
      <div class="runtime-status-grid">
        <div>
          <strong>Native support</strong>
          <p>document.modelContext ${hasNativeSupport ? '可用' : '不可用'}</p>
        </div>
        <div>
          <strong>Registration status</strong>
          <p>${escapeHtml(registrationStatus)}</p>
        </div>
        <div>
          <strong>Browser API observation</strong>
          ${toolNames === '' ? '<p>尚未觀測到 Tool。</p>' : `<ul>${toolNames}</ul>`}
        </div>
      </div>
      <p class="runtime-warning">此清單是 document.modelContext.getTools() 的 Browser observation，不是 Gemini／AI Agent discovery；真實 Agent／Inspector 證據會另行手動記錄。</p>
      ${runtimeError === undefined ? '' : `<p class="runtime-warning">${escapeHtml(runtimeError)}</p>`}
      <form id="native-tool-evidence-form">
        <label for="native-tool-query">直接呼叫輸入</label>
        <div class="search-controls">
          <input id="native-tool-query" name="query" type="search" value="${escapeHtml(nativeToolQuery)}" data-testid="native-tool-query" />
          <button type="submit" data-testid="native-tool-invoke">用瀏覽器 API 驗證</button>
        </div>
      </form>
      <p class="runtime-warning">這是瀏覽器 API 驗證，不是 AI Agent 對話。</p>
      ${lastInvocation === undefined ? '' : `
        <div class="runtime-evidence-log" data-testid="runtime-evidence-log" aria-live="polite">
          <strong>Last invocation input</strong>
          <pre><code>${escapeHtml(JSON.stringify(lastInvocation.input, null, 2))}</code></pre>
          <strong>Raw result</strong>
          <pre><code>${escapeHtml(lastInvocation.rawResult)}</code></pre>
        </div>
      `}
    </section>
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
  const detailUrl = detailUrlFor(event.id);

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
        <a class="event-card__detail" href="${escapeHtml(detailUrl)}" data-action="detail" data-event-id="${event.id}">查看詳情</a>
        <button type="button" data-action="save" data-event-id="${event.id}" aria-pressed="${isSaved}" ${isSaved ? 'disabled' : ''}>${saveLabel}</button>
      </div>
    </article>
  `;
}

function renderDeclarativeSearchLab(): string {
  const preview = createDeclarativeToolPreview(declarativeSearchLabDefinition);

  return `
    <section class="webmcp-lab" aria-labelledby="declarative-lab-title">
      <div class="webmcp-lab__heading">
        <div>
          <p class="section-label">Day 11｜Declarative API Lab</p>
          <h2 id="declarative-lab-title">讓標準表單描述練習用能力</h2>
        </div>
        <p>這個 Lab 與正式 Demo 搜尋表單分開；它的名稱固定為 <code>search_events_lab</code>。</p>
      </div>
      <form
        class="declarative-lab-form"
        id="declarative-search-lab"
        toolname="search_events_lab"
        tooldescription="依關鍵字尋找公開活動。這是 Day 11 的宣告式練習，不是正式搜尋 Tool。"
      >
        <label for="declarative-search-query">活動關鍵字</label>
        <div class="search-controls">
          <input
            id="declarative-search-query"
            name="query"
            type="search"
            required
            toolparamdescription="用於比對公開活動的關鍵字。"
            placeholder="例如：前端"
          />
          <button type="submit">填寫 Lab 表單</button>
        </div>
      </form>
      <div class="webmcp-lab__preview" data-testid="declarative-preview">
        <h3>教學結構預覽（非 Agent discovery）</h3>
        <p>支援 WebMCP 的瀏覽器會從表單屬性合成 schema；以下內容只顯示本 Lab 的預期結構，沒有模擬或呼叫 Agent。</p>
        <pre><code>${escapeHtml(JSON.stringify(preview, null, 2))}</code></pre>
      </div>
    </section>
  `;
}

function renderEventDetail(): string {
  const route = eventRoute;

  if (route.kind === 'not-found') {
    return `
      <section class="event-not-found" data-testid="event-not-found" aria-labelledby="event-not-found-title">
        <p class="section-label">活動不存在</p>
        <h2 id="event-not-found-title">找不到指定的活動</h2>
        <p>eventId「${escapeHtml(route.eventId)}」不在目前活動清單中。</p>
        <a href="/">返回活動搜尋</a>
      </section>
    `;
  }

  const selectedEvent = route.kind === 'detail'
    ? events.find((event) => event.id === route.eventId)
    : undefined;

  if (selectedEvent === undefined) {
    return '';
  }

  return `
    <div class="dialog-backdrop">
      <section class="event-dialog" role="dialog" aria-modal="true" aria-labelledby="event-dialog-title">
        <a class="dialog-close" href="/" data-action="close-detail" aria-label="關閉詳情">×</a>
        <p class="section-label">${selectedEvent.category}｜${formatDate(selectedEvent.date)}</p>
        <h2 id="event-dialog-title">${selectedEvent.title}</h2>
        <p>${selectedEvent.summary}</p>
        <p class="event-card__location">地點：${selectedEvent.location}</p>
        ${renderEventDetailSavedState(selectedEvent)}
        ${renderImperativeLabStatus()}
      </section>
    </div>
  `;
}

function renderImperativeLabStatus(): string {
  if (!webMcpAdapter.supported) {
    return `
      <aside class="imperative-lab-status" data-testid="imperative-lab-status" aria-live="polite">
        <strong>Day 12｜Imperative API Lab</strong>
        <p>此瀏覽器未提供 WebMCP，因此沒有註冊 Tool，也沒有 Agent discovery 或 invocation。</p>
      </aside>
    `;
  }

  return `
    <aside class="imperative-lab-status" data-testid="imperative-lab-status" aria-live="polite">
      <strong>Day 21｜詳情狀態 Tool</strong>
      <p>正在更新目前頁面狀態可用的 Tool；只有顯示活動詳情時才會宣告 <code>save_event</code>。</p>
    </aside>
  `;
}

function renderEventDetailSavedState(event: EventItem): string {
  const isSaved = savedEventIds.includes(event.id);

  return `
    <div class="event-detail-saved-state" data-testid="event-detail-saved-state">
      <p>收藏狀態：<strong>${isSaved ? '已收藏' : '尚未收藏'}</strong></p>
      <button type="button" data-action="save" data-event-id="${event.id}" ${isSaved ? 'disabled' : ''}>${isSaved ? '已收藏' : '收藏活動'}</button>
    </div>
  `;
}

function renderSavedEventsList(): string {
  const savedEvents = savedEventIds
    .map((eventId) => events.find((event) => event.id === eventId))
    .filter((event): event is EventItem => event !== undefined);
  const undoEvent = lastRemovedEventId === null
    ? undefined
    : events.find((event) => event.id === lastRemovedEventId);

  return `
    <section class="saved-events" data-testid="saved-events-list" aria-labelledby="saved-events-title" aria-live="polite">
      <div class="saved-events__heading">
        <div>
          <p class="section-label">Day 22｜人類可見的收藏狀態</p>
          <h2 id="saved-events-title">我的收藏</h2>
        </div>
        <p>收藏狀態以 server 為準，重新載入後會重新同步。</p>
      </div>
      ${savedEventsError === null ? '' : `<p class="saved-events__error">${escapeHtml(savedEventsError)}</p>`}
      ${savedEvents.length === 0
        ? '<p class="saved-events__empty">尚未收藏任何活動</p>'
        : `<ul class="saved-events__items">${savedEvents.map(renderSavedEvent).join('')}</ul>`}
      ${undoEvent === undefined ? '' : `
        <div class="saved-events__undo" aria-live="polite">
          <p>已取消收藏「${escapeHtml(undoEvent.title)}」。</p>
          <button type="button" data-action="undo-remove" data-event-id="${undoEvent.id}" data-testid="saved-events-undo">復原收藏</button>
        </div>
      `}
    </section>
  `;
}

function renderSavedEvent(event: EventItem): string {
  return `
    <li>
      <span>${escapeHtml(event.title)}</span>
      <button type="button" data-action="remove-saved" data-event-id="${event.id}" data-testid="remove-saved-${event.id}">取消收藏</button>
    </li>
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

function enqueueSearchEventsRuntimeOperation(
  operation: () => Promise<SearchEventsRuntimeSnapshot>
): void {
  searchEventsRuntimeOperation = searchEventsRuntimeOperation.then(async () => {
    searchEventsRuntimeSnapshot = await operation();
    render();
  });
}

function synchronizeWebMcpTools(): void {
  searchEventsRuntimeOperation = searchEventsRuntimeOperation.then(async () => {
    await currentEventToolLifecycle.sync(eventRoute);
    render();
  });
}

async function initializeApplication(): Promise<void> {
  try {
    await savedEventsApi.createDemoSession();
    await synchronizeSavedEvents();
  } catch (error) {
    savedEventsError = '無法同步收藏狀態，請稍後再試。';
    console.error('無法建立 Demo session 或同步收藏狀態。', error);
    render();
  }

  synchronizeWebMcpTools();
}

async function synchronizeSavedEvents(): Promise<void> {
  savedEventIds = await savedEventsApi.listSavedEventIds();
  savedEventsError = null;
  render();
}

async function synchronizeSavedEventsAfterToolInvocation(): Promise<void> {
  try {
    await synchronizeSavedEvents();
  } catch (error) {
    savedEventsError = '收藏已完成，但無法同步畫面狀態，請重新載入頁面。';
    console.error('save_event 成功後無法同步收藏狀態。', error);
    render();
  }
}

async function removeSavedEventFromHumanUi(eventId: string): Promise<void> {
  const result = await savedEventsApi.removeEvent(eventId);

  if (result.status === 'error') {
    savedEventsError = result.message;
    render();

    return;
  }

  lastRemovedEventId = eventId;
  await synchronizeSavedEvents();
}

function invokeSearchEventsForEvidence(form: HTMLFormElement): void {
  const formData = new FormData(form);
  const query = String(formData.get('query') ?? '');
  nativeToolQuery = query;
  enqueueSearchEventsRuntimeOperation(() => searchEventsRuntime.invokeForEvidence({ query }));
}

appRoot.addEventListener('submit', (event) => {
  if (!(event.target instanceof HTMLFormElement)) {
    return;
  }

  if (event.target.id === 'native-tool-evidence-form') {
    event.preventDefault();
    invokeSearchEventsForEvidence(event.target);

    return;
  }

  if (event.target.id === 'declarative-search-lab') {
    event.preventDefault();

    return;
  }

  if (event.target.id !== 'event-search-form') {
    return;
  }

  event.preventDefault();
  const formData = new FormData(event.target);
  activeQuery = String(formData.get('query') ?? '');
  visibleEvents = searchEvents(activeQuery);
  render();
});

appRoot.addEventListener('input', (event) => {
  if (!(event.target instanceof HTMLInputElement)) {
    return;
  }

  if (event.target.id === 'event-search') {
    activeQuery = event.target.value;
  }

  if (event.target.id === 'native-tool-query') {
    nativeToolQuery = event.target.value;
  }
});

appRoot.addEventListener('click', (event) => {
  const actionElement = event.target instanceof Element
    ? event.target.closest<HTMLElement>('[data-action]')
    : null;
  const action = actionElement?.dataset.action;
  const eventId = actionElement?.dataset.eventId;

  if (actionElement instanceof HTMLAnchorElement && (action === 'detail' || action === 'close-detail')) {
    event.preventDefault();
    const targetUrl = new URL(actionElement.href);
    window.history.pushState(null, '', targetUrl);
    eventRoute = readEventRoute(targetUrl.search);
    currentEventToolLifecycle.invalidate();
    synchronizeWebMcpTools();
    render();

    return;
  }

  if (eventId === undefined) {
    return;
  }

  if (action === 'save') {
    void saveEventFromHumanUi(eventId);
  }

  if (action === 'remove-saved') {
    void removeSavedEventFromHumanUi(eventId);
  }

  if (action === 'undo-remove') {
    void saveEventFromHumanUi(eventId);
  }

  render();
});

window.addEventListener('popstate', () => {
  eventRoute = readEventRoute(window.location.search);
  currentEventToolLifecycle.invalidate();
  synchronizeWebMcpTools();
  render();
});

render();
void initializeApplication();
