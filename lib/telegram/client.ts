// lib/telegram/client.ts
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_SUPPORT_CHAT_ID = process.env.TELEGRAM_SUPPORT_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN environment variable');
}

if (!TELEGRAM_SUPPORT_CHAT_ID) {
  throw new Error('Missing TELEGRAM_SUPPORT_CHAT_ID environment variable');
}

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function sendSupportMessageToTelegram(params: {
  cid: string;
  text: string;
  name?: string | null;
  email?: string | null;
  userId?: string | null;
}): Promise<{ messageId: number }> {
  const { cid, text, name, email, userId } = params;

  const headerLines: string[] = [
    'Новый запрос с сайта',
    `CID: ${cid}`,
  ];

  if (name) headerLines.push(`Имя: ${name}`);
  if (email) headerLines.push(`Email: ${email}`);
  if (userId) headerLines.push(`User ID: ${userId}`);

  const messageText = `${headerLines.join('\n')}\n\nСообщение: ${text}`;

  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_SUPPORT_CHAT_ID,
      text: messageText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    console.error('Telegram sendMessage error:', data);
    throw new Error(`Telegram sendMessage error: ${data.description || 'unknown error'}`);
  }

  const messageId = data.result?.message_id;
  if (typeof messageId !== 'number') {
    throw new Error('Telegram sendMessage did not return message_id');
  }

  return { messageId };
}

