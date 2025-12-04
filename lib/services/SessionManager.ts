// lib/services/SessionManager.ts
// Управление сессиями поддержки

import {
  getOrCreateSession,
  updateSessionTopicId,
  getSessionByTopicId,
  SupportSession,
} from "@/lib/db-support";

export class SessionManager {
  /**
   * Получить или создать сессию по CID
   */
  async getOrCreateSession(params: {
    cid: string;
    user_name?: string | null;
    user_id?: string | null;
    email?: string | null;
  }): Promise<SupportSession> {
    try {
      return await getOrCreateSession(params);
    } catch (error) {
      console.error("[SessionManager] Failed to get/create session:", error);
      throw new Error(`SESSION_ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Обновить topic_id для сессии
   */
  async updateTopicId(cid: string, topicId: number): Promise<void> {
    try {
      await updateSessionTopicId(cid, topicId);
    } catch (error) {
      console.error("[SessionManager] Failed to update topic_id:", error);
      throw new Error(`UPDATE_TOPIC_ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Получить сессию по topic_id
   */
  async getSessionByTopicId(topicId: number): Promise<SupportSession | null> {
    try {
      return await getSessionByTopicId(topicId);
    } catch (error) {
      console.error("[SessionManager] Failed to get session by topic_id:", error);
      return null;
    }
  }

  /**
   * Проверить существование сессии по CID
   */
  async sessionExists(cid: string): Promise<boolean> {
    try {
      const session = await this.getOrCreateSession({ cid });
      return !!session;
    } catch (error) {
      return false;
    }
  }
}

