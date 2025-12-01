// lib/supportStore.ts

export type SupportAuthor = "user" | "support";

export interface SupportMessage {
  id: string;
  cid: string;              // client id (из localStorage)
  author: SupportAuthor;    // "user" или "support"
  text: string;
  createdAt: string;        // ISO
}

// Простое хранилище в памяти (на уровне процесса)
const store = new Map<string, SupportMessage[]>();

export function addSupportMessage(message: SupportMessage) {
  const existing = store.get(message.cid) ?? [];
  existing.push(message);
  store.set(message.cid, existing);
}

export function getSupportMessages(cid: string): SupportMessage[] {
  return store.get(cid) ?? [];
}

