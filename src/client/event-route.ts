export type EventRoute =
  | { readonly kind: 'search' }
  | { readonly kind: 'detail'; readonly eventId: string }
  | { readonly kind: 'not-found'; readonly eventId: string };

/** 將 location.search 解析為活動搜尋、詳情或不存在三種 route。 */
export function readEventRoute(search: string): EventRoute {
  const eventId = new URLSearchParams(search).get('event');

  if (eventId === null) {
    return { kind: 'search' };
  }

  return findEventById(eventId) === undefined
    ? { kind: 'not-found', eventId }
    : { kind: 'detail', eventId };
}
import { findEventById } from '../domain/event-catalog';
