import type { EventItem } from '../domain/events';
import type { WebMcpAdapter } from '../webmcp/webmcp-adapter';
import type { WebMcpToolDefinition } from '../webmcp/types';

/**
 * 將唯讀的「目前查看活動」Lab Tool 綁定在詳情對話框的生命週期。
 */
export class CurrentEventToolLifecycle {
  public constructor(private readonly adapter: WebMcpAdapter | null) {}

  /**
   * 活動詳情開啟時註冊 Tool；關閉時中止 signal 以解除註冊。
   */
  public async sync(event: EventItem | null): Promise<void> {
    if (this.adapter === null) {
      return;
    }

    if (event === null) {
      this.adapter.clearTools();
      return;
    }

    await this.adapter.replaceTools([createCurrentEventTool(event)]);
  }
}

function createCurrentEventTool(event: EventItem): WebMcpToolDefinition {
  return {
    name: 'get_current_event_lab',
    description: '讀取使用者目前正在查看的活動摘要。僅在活動詳情開啟期間可用。',
    inputSchema: {
      type: 'object'
    },
    annotations: {
      readOnlyHint: true
    },
    execute: async () => {
      return JSON.stringify({
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        summary: event.summary
      });
    }
  };
}
