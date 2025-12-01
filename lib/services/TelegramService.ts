// lib/services/TelegramService.ts
// Сервис для работы с Telegram Bot API

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPPORT_CHAT_ID = process.env.TELEGRAM_SUPPORT_CHAT_ID;

export interface TelegramMessage {
  message_id: number;
  text: string;
  chat: {
    id: number;
  };
  message_thread_id?: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name?: string;
    username?: string;
  };
}

export interface CreateTopicResponse {
  ok: boolean;
  result?: {
    message_thread_id: number;
    name: string;
    icon_color: number;
  };
  description?: string;
}

export interface SendMessageResponse {
  ok: boolean;
  result?: {
    message_id: number;
  };
  description?: string;
}

export class TelegramService {
  private botToken: string;
  private supportChatId: string;

  constructor() {
    if (!BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables");
    }
    if (!SUPPORT_CHAT_ID) {
      throw new Error("TELEGRAM_SUPPORT_CHAT_ID is not set in environment variables");
    }
    this.botToken = BOT_TOKEN;
    this.supportChatId = SUPPORT_CHAT_ID;
  }

  /**
   * Создать тему в форуме Telegram
   */
  async createForumTopic(name: string): Promise<number> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/createForumTopic`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: this.supportChatId,
            name: name,
          }),
        }
      );

      const data: CreateTopicResponse = await response.json();

      if (!response.ok || !data?.result?.message_thread_id) {
        const errorMsg = data?.description || JSON.stringify(data);
        console.error("[TelegramService] Failed to create topic:", errorMsg);
        throw new Error(`CREATE_TOPIC_FAILED: ${errorMsg}`);
      }

      const topicId = data.result.message_thread_id;
      console.log(`[TelegramService] ✅ Created forum topic: "${name}" (ID: ${topicId})`);
      return topicId;
    } catch (error) {
      console.error("[TelegramService] Error creating forum topic:", error);
      throw error;
    }
  }

  /**
   * Отправить сообщение в тему
   */
  async sendMessage(topicId: number, text: string): Promise<number> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: this.supportChatId,
            message_thread_id: topicId,
            text: text,
            parse_mode: "HTML",
          }),
        }
      );

      const data: SendMessageResponse = await response.json();

      if (!response.ok || !data?.result?.message_id) {
        const errorMsg = data?.description || JSON.stringify(data);
        console.error("[TelegramService] Failed to send message:", errorMsg);
        throw new Error(`SEND_MESSAGE_FAILED: ${errorMsg}`);
      }

      console.log(`[TelegramService] ✅ Sent message to topic ${topicId}`);
      return data.result.message_id;
    } catch (error) {
      console.error("[TelegramService] Error sending message:", error);
      throw error;
    }
  }

  /**
   * Отправить карточку клиента в тему
   */
  async sendClientCard(params: {
    topicId: number;
    name?: string | null;
    userId?: string | null;
    email?: string | null;
    cid: string;
  }): Promise<void> {
    const cardText =
      "🆕 <b>Новый запрос с сайта</b>\n\n" +
      `🧑 <b>Имя:</b> ${params.name || "Гость сайта"}\n` +
      `🆔 <b>ID пользователя:</b> ${params.userId || "—"}\n` +
      `📧 <b>Email:</b> ${params.email || "—"}\n` +
      `🧩 <b>CID:</b> <code>${params.cid}</code>\n` +
      "──────────────";

    await this.sendMessage(params.topicId, cardText);
  }

  /**
   * Отправить сообщение пользователя в тему
   */
  async sendUserMessage(topicId: number, message: string): Promise<void> {
    const formattedMessage = `💬 <b>Пользователь:</b>\n${this.escapeHtml(message)}`;
    await this.sendMessage(topicId, formattedMessage);
  }

  /**
   * Получить информацию о webhook
   */
  async getWebhookInfo(): Promise<any> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getWebhookInfo`
      );
      return await response.json();
    } catch (error) {
      console.error("[TelegramService] Error getting webhook info:", error);
      throw error;
    }
  }

  /**
   * Установить webhook
   */
  async setWebhook(url: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      console.error("[TelegramService] Error setting webhook:", error);
      throw error;
    }
  }

  /**
   * Экранировать HTML для безопасной отправки
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Получить chat_id поддержки
   */
  getSupportChatId(): string {
    return this.supportChatId;
  }
}

