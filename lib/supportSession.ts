// lib/supportSession.ts

export type SupportMessage = {
  text: string;
  from: "user" | "admin";
  timestamp: string;
};

export type SupportSession = {
  cid: string;
  topicId: number;
  userName: string | null;
  userId: string | null;
  email: string | null;
  createdAt: string;
  pendingMessages: SupportMessage[];
};

type SessionsStore = {
  sessions: Map<string, SupportSession>; // cid -> session
  topicsIndex: Map<number, string>; // topicId -> cid
  wsConnections: Map<string, Set<WebSocket>>; // cid -> Set<WebSocket>
};

declare global {
  // eslint-disable-next-line no-var
  var __supportSessions: SessionsStore | undefined;
}

export function getSessionsStore(): SessionsStore {
  if (!global.__supportSessions) {
    global.__supportSessions = {
      sessions: new Map(),
      topicsIndex: new Map(),
      wsConnections: new Map(),
    };
  }
  return global.__supportSessions;
}

export function getSession(cid: string): SupportSession | undefined {
  const store = getSessionsStore();
  return store.sessions.get(cid);
}

export function createSession(params: {
  cid: string;
  topicId: number;
  userName?: string | null;
  userId?: string | null;
  email?: string | null;
}): SupportSession {
  const store = getSessionsStore();

  const session: SupportSession = {
    cid: params.cid,
    topicId: params.topicId,
    userName: params.userName || null,
    userId: params.userId || null,
    email: params.email || null,
    createdAt: new Date().toISOString(),
    pendingMessages: [],
  };

  store.sessions.set(params.cid, session);
  store.topicsIndex.set(params.topicId, params.cid);

  return session;
}

export function getCidByTopicId(topicId: number): string | undefined {
  const store = getSessionsStore();
  return store.topicsIndex.get(topicId);
}

export function addPendingMessage(cid: string, message: SupportMessage): void {
  const store = getSessionsStore();
  const session = store.sessions.get(cid);

  if (!session) {
    console.warn(`Session not found for cid: ${cid}`);
    return;
  }

  session.pendingMessages.push(message);

  // Сообщения будут доставлены через SSE или polling
  // SSE endpoint проверяет pendingMessages каждые 500ms
}

export function getAndClearPendingMessages(cid: string): SupportMessage[] {
  const store = getSessionsStore();
  const session = store.sessions.get(cid);

  if (!session) {
    return [];
  }

  const messages = [...session.pendingMessages];
  session.pendingMessages = [];
  return messages;
}

export function addWebSocketConnection(cid: string, ws: WebSocket): void {
  const store = getSessionsStore();
  if (!store.wsConnections.has(cid)) {
    store.wsConnections.set(cid, new Set());
  }
  store.wsConnections.get(cid)!.add(ws);
}

export function removeWebSocketConnection(cid: string, ws: WebSocket): void {
  const store = getSessionsStore();
  const wsSet = store.wsConnections.get(cid);
  if (wsSet) {
    wsSet.delete(ws);
    if (wsSet.size === 0) {
      store.wsConnections.delete(cid);
    }
  }
}

