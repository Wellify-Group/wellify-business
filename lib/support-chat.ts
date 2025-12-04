// lib/support-chat.ts
import { addSupportMessage, getSupportMessages, SupportMessage, SupportAuthor } from "@/lib/supportStore";

export type { SupportAuthor, SupportMessage };

/**
 * Сохраняет сообщение поддержки в хранилище
 */
export async function saveSupportMessage(params: {
  cid: string;
  author: SupportAuthor;
  text: string;
  name?: string | null;
  userId?: string | null;
  email?: string | null;
}): Promise<SupportMessage> {
  const message: SupportMessage = {
    id: crypto.randomUUID(),
    cid: params.cid,
    author: params.author,
    text: params.text.trim(),
    createdAt: new Date().toISOString(),
  };

  addSupportMessage(message);
  return message;
}

/**
 * Получает все сообщения поддержки по CID
 */
export async function getSupportMessagesByCid(cid: string): Promise<SupportMessage[]> {
  return getSupportMessages(cid);
}

