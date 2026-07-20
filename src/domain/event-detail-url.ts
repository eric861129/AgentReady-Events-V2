/** 建立只帶 canonical eventId 的活動詳情網址。 */
export function createEventDetailUrl(baseUrl: string, eventId: string): string {
  const url = new URL(baseUrl);
  url.search = '';
  url.searchParams.set('event', eventId);
  url.hash = '';

  return url.href;
}
