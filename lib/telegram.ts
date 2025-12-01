// lib/telegram.ts
// ⚠️ DEPRECATED: Используйте TelegramService из lib/services/TelegramService.ts
// Этот файл оставлен для обратной совместимости

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPPORT_CHAT_ID = process.env.TELEGRAM_SUPPORT_CHAT_ID;

if (!BOT_TOKEN) {
  console.warn("[Telegram] TELEGRAM_BOT_TOKEN is not set");
}
if (!SUPPORT_CHAT_ID) {
  console.warn("[Telegram] TELEGRAM_SUPPORT_CHAT_ID is not set");
}

export async function createForumTopic(params: {
  name: string;
}): Promise<number> {
  if (!BOT_TOKEN || !SUPPORT_CHAT_ID) {
    throw new Error("Telegram config missing: BOT_TOKEN or SUPPORT_CHAT_ID not set");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/createForumTopic`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: SUPPORT_CHAT_ID,
        name: params.name,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data?.result?.message_thread_id) {
    console.error("Failed to create forum topic:", data);
    const errorMsg = data?.description || JSON.stringify(data);
    throw new Error(`CREATE_TOPIC_FAILED: ${errorMsg}`);
  }

  const topicId = data.result.message_thread_id as number;
  console.log(`✅ Created forum topic: "${params.name}" (ID: ${topicId})`);
  return topicId;
}

export async function sendMessage(params: {
  topicId: number;
  text: string;
}): Promise<void> {
  if (!BOT_TOKEN || !SUPPORT_CHAT_ID) {
    throw new Error("Telegram config missing: BOT_TOKEN or SUPPORT_CHAT_ID not set");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: SUPPORT_CHAT_ID,
        message_thread_id: params.topicId,
        text: params.text,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Failed to send message to Telegram:", error);
    const errorMsg = error?.description || JSON.stringify(error);
    throw new Error(`SEND_MESSAGE_FAILED: ${errorMsg}`);
  }
}

export function getSupportChatId(): string {
  if (!SUPPORT_CHAT_ID) {
    throw new Error("TELEGRAM_SUPPORT_CHAT_ID is not set");
  }
  return SUPPORT_CHAT_ID;
}

