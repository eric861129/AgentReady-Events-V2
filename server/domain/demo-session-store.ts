export const demoSessionCookieName = 'demo_session';

export interface DemoPrincipal {
  readonly userId: 'demo-reader';
}

export interface DemoSession {
  readonly token: string;
  readonly principal: DemoPrincipal;
}

export interface DemoSessionStore {
  create(): DemoSession;
  getPrincipal(cookieHeader: string | undefined): DemoPrincipal | undefined;
}

/** 建立記憶體內 Demo session store，token 一律由 server 產生。 */
export function createDemoSessionStore(randomUUID: () => string): DemoSessionStore {
  const sessions = new Map<string, DemoPrincipal>();

  return {
    create(): DemoSession {
      let token = randomUUID();

      while (sessions.has(token)) {
        token = randomUUID();
      }

      const principal: DemoPrincipal = { userId: 'demo-reader' };
      sessions.set(token, principal);

      return { token, principal };
    },
    getPrincipal(cookieHeader: string | undefined): DemoPrincipal | undefined {
      const token = readCookie(cookieHeader, demoSessionCookieName);

      return token === undefined ? undefined : sessions.get(token);
    }
  };
}

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (cookieHeader === undefined) {
    return undefined;
  }

  for (const segment of cookieHeader.split(';')) {
    const separatorIndex = segment.indexOf('=');

    if (separatorIndex < 0 || segment.slice(0, separatorIndex).trim() !== name) {
      continue;
    }

    const value = segment.slice(separatorIndex + 1).trim();

    return value.length === 0 ? undefined : value;
  }

  return undefined;
}
