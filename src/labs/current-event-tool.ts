import type { EventItem } from '../domain/events';
import type { ModelContext, ModelContextTool } from '../webmcp/types';

/**
 * 將唯讀的「目前查看活動」Lab Tool 綁定在詳情對話框的生命週期。
 */
export class CurrentEventToolLifecycle {
  private registrationController: AbortController | null = null;

  public constructor(private readonly modelContext: ModelContext | null) {}

  /**
   * 活動詳情開啟時註冊 Tool；關閉時中止 signal 以解除註冊。
   */
  public async sync(event: EventItem | null): Promise<void> {
    this.registrationController?.abort();
    this.registrationController = null;

    if (this.modelContext === null || event === null) {
      return;
    }

    const registrationController = new AbortController();
    this.registrationController = registrationController;

    await this.modelContext.registerTool(createCurrentEventTool(event), {
      signal: registrationController.signal
    });
  }
}

function createCurrentEventTool(event: EventItem): ModelContextTool {
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
