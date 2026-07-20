import type { DemoPrincipal } from './demo-session-store';

export interface SavedEventMutation {
  readonly eventId: string;
  readonly saved: boolean;
  readonly changed: boolean;
}

export class EventNotFoundError extends Error {
  readonly errorCode = 'EVENT_NOT_FOUND';

  constructor(readonly eventId: string) {
    super(`找不到活動：${eventId}`);
    this.name = 'EventNotFoundError';
  }
}

export interface SavedEventsService {
  save(principal: DemoPrincipal, eventId: string): SavedEventMutation;
  remove(principal: DemoPrincipal, eventId: string): SavedEventMutation;
  list(principal: DemoPrincipal): readonly string[];
}

/** 建立只接受 session principal 的記憶體收藏服務。 */
export function createSavedEventsService(dependencies: {
  readonly findEventById: (eventId: string) => unknown | undefined;
}): SavedEventsService {
  const savedEventIdsByUser = new Map<DemoPrincipal['userId'], Set<string>>();

  function requireKnownEvent(eventId: string): void {
    if (dependencies.findEventById(eventId) === undefined) {
      throw new EventNotFoundError(eventId);
    }
  }

  function getOrCreateSavedEventIds(principal: DemoPrincipal): Set<string> {
    const existing = savedEventIdsByUser.get(principal.userId);

    if (existing !== undefined) {
      return existing;
    }

    const created = new Set<string>();
    savedEventIdsByUser.set(principal.userId, created);

    return created;
  }

  return {
    save(principal: DemoPrincipal, eventId: string): SavedEventMutation {
      requireKnownEvent(eventId);
      const savedEventIds = getOrCreateSavedEventIds(principal);
      const previousSize = savedEventIds.size;
      savedEventIds.add(eventId);

      return { eventId, saved: true, changed: savedEventIds.size !== previousSize };
    },
    remove(principal: DemoPrincipal, eventId: string): SavedEventMutation {
      requireKnownEvent(eventId);
      const changed = savedEventIdsByUser.get(principal.userId)?.delete(eventId) ?? false;

      return { eventId, saved: false, changed };
    },
    list(principal: DemoPrincipal): readonly string[] {
      return [...(savedEventIdsByUser.get(principal.userId) ?? [])];
    }
  };
}
