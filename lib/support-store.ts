// lib/support-store.ts

export type SupportMessage = {
  id: string;
  cid: string;
  author: "user" | "support";
  text: string;
  createdAt: string;
};

export type SupportSession = {
  cid: string;
  topicId: number; // message_thread_id из Telegram
  userName?: string | null;
  userId?: string | null;
  email?: string | null;
  createdAt: string; // ISO
};

type SupportStore = {
  sessions: Map<string, SupportSession>; // cid -> session
  topicsIndex: Map<number, string>; // topicId -> cid
  messages: Map<string, SupportMessage[]>; // cid -> messages[]
};

declare global {
  // eslint-disable-next-line no-var
  var __supportStore: SupportStore | undefined;
}

export function getSupportStore(): SupportStore {
  if (!global.__supportStore) {
    global.__supportStore = {
      sessions: new Map(),
      topicsIndex: new Map(),
      messages: new Map(),
    };
  }
  return global.__supportStore;
}

export async function getOrCreateSession(params: {
  cid: string;
  userName?: string | null;
  userId?: string | null;
  email?: string | null;
  topicIdCreator: () => Promise<number>;
}): Promise<SupportSession> {
  const store = getSupportStore();

  // Проверяем, есть ли уже сессия
  const existing = store.sessions.get(params.cid);
  if (existing) {
    return existing;
  }

  // Создаём новую сессию
  const topicId = await params.topicIdCreator();

  const session: SupportSession = {
    cid: params.cid,
    topicId,
    userName: params.userName,
    userId: params.userId,
    email: params.email,
    createdAt: new Date().toISOString(),
  };

  store.sessions.set(params.cid, session);
  store.topicsIndex.set(topicId, params.cid);

  return session;
}

export function appendMessage(cid: string, msg: SupportMessage): void {
  const store = getSupportStore();
  const messages = store.messages.get(cid) || [];
  messages.push(msg);
  store.messages.set(cid, messages);
}

export function getMessages(cid: string): SupportMessage[] {
  const store = getSupportStore();
  return store.messages.get(cid) || [];
}

