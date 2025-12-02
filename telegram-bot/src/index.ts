import "dotenv/config";
import { Telegraf, Context } from "telegraf";
import { createClient } from "@supabase/supabase-js";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

const bot = new Telegraf(botToken);

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MANAGERS_CHAT_ID = Number(process.env.SUPPORT_MANAGERS_CHAT_ID);

// /start <token> - приветствие
bot.start(async (ctx) => {
  const from = ctx.from;
  const args = ctx.message?.text?.split(" ") || [];
  const token = args[1]; // на будущее, пока не используем

  const fullName = `${from.first_name ?? ""} ${from.last_name ?? ""}`.trim();
  let intro = `Привет, ${fullName || "друг"}! 👋\n`;
  intro += `Ты написал в поддержку WELLIFY.\n\n`;
  intro += `Пожалуйста, опиши свою проблему одним сообщением - мы передадим её менеджеру.`;

  await ctx.reply(intro);
});

// Любое текстовое сообщение - создаём тикет и уведомляем менеджеров
bot.on("text", async (ctx: Context) => {
  const msg = ctx.message;

  // msg может быть undefined, поэтому сначала проверяем это
  if (!msg || !("text" in msg) || typeof msg.text !== "string") {
    return;
  }

  const text = msg.text.trim();
  if (!text) {
    await ctx.reply("Пожалуйста, опиши проблему текстом.");
    return;
  }

  const from = msg.from;
  const telegramFullName = `${from.first_name ?? ""} ${from.last_name ?? ""}`.trim() || null;
  const telegramUsername = from.username ? `@${from.username}` : null;

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      telegram_user_id: from.id,
      telegram_username: telegramUsername,
      telegram_full_name: telegramFullName,
      message: text,
    })
    .select("*")
    .single();

  if (error) {
    console.error("support_tickets insert error:", error);
  }

  const ticketId = ticket?.id ?? "(без ID)";
  const createdAt = ticket?.created_at ?? new Date().toISOString();

  const managerText =
    `🆕 *Новое обращение в поддержку*\n\n` +
    `*ID тикета:* \`${ticketId}\`\n` +
    `*Когда:* ${createdAt}\n\n` +
    `*Клиент:* ${telegramFullName ?? "неизвестно"}\n` +
    `*Username:* ${telegramUsername ?? "нет"}\n` +
    `*Telegram ID:* \`${from.id}\`\n\n` +
    `*Сообщение:*\n` +
    `${text}\n\n` +
    `Ответить клиенту можно напрямую в Telegram по username или по ID.`;

  if (MANAGERS_CHAT_ID) {
    await ctx.telegram.sendMessage(MANAGERS_CHAT_ID, managerText, {
      parse_mode: "Markdown",
    });
  }

  await ctx.reply(
    "Спасибо! Мы получили твоё сообщение. Менеджер свяжется с тобой в ближайшее время."
  );
});

bot.launch().then(() => {
  console.log("Support bot started");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

