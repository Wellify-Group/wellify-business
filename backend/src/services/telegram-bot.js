/**
 * Telegram Bot Service
 * Интеграция Telegram бота для регистрации и поддержки
 */

import { Telegraf } from 'telegraf';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
const SUPPORT_MANAGERS_CHAT_ID = process.env.SUPPORT_MANAGERS_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN) {
  logger.warn('TELEGRAM_BOT_TOKEN not set, Telegram bot will not be initialized');
}

if (!TELEGRAM_BOT_USERNAME) {
  logger.warn('TELEGRAM_BOT_USERNAME not set, Telegram links may not work correctly');
}

// Инициализация бота
let bot = null;
if (TELEGRAM_BOT_TOKEN) {
  bot = new Telegraf(TELEGRAM_BOT_TOKEN);
} else {
  logger.warn('Telegram bot not initialized - TELEGRAM_BOT_TOKEN missing');
}

// Состояние ожидания описания проблемы (поддержка)
const waitingForDescription = new Map();

// Состояние ожидания номера телефона для регистрации
// Map<chatId, sessionToken>
const waitingForPhone = new Map();

// =========================
// Registration session helpers
// =========================

/**
 * Создать сессию регистрации
 */
async function createRegistrationSession({ userId, email, language = 'ru' }) {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // +30 минут

  logger.info('[createRegistrationSession] Creating session', {
    userId,
    email,
    language,
    expiresAt,
  });

  const result = await db.query(
    `INSERT INTO registration_sessions (user_id, email, language, status, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, email, language || 'ru', 'pending', expiresAt]
  );

  if (result.rows.length === 0) {
    throw new Error('Failed to create registration session');
  }

  const session = result.rows[0];

  logger.info('[createRegistrationSession] Session created successfully', {
    sessionId: session.id,
    userId: session.user_id,
    email: session.email,
    status: session.status,
    expiresAt: session.expires_at,
  });

  return session;
}

/**
 * Получить статус сессии
 */
async function getSessionStatus(sessionToken) {
  logger.info('[getSessionStatus] Checking session status', {
    sessionToken,
  });

  const result = await db.query(
    `SELECT id, user_id, status, expires_at, phone
     FROM registration_sessions
     WHERE id = $1`,
    [sessionToken]
  );

  if (result.rows.length === 0) {
    logger.info('[getSessionStatus] Session not found:', sessionToken);
    return {
      status: 'expired',
      telegramVerified: false,
      phone: null,
      phoneVerified: false,
    };
  }

  const session = result.rows[0];
  const now = new Date();
  const expires = new Date(session.expires_at);

  let status = session.status;

  if (status === 'pending' && now > expires) {
    await db.query(
      'UPDATE registration_sessions SET status = $1 WHERE id = $2',
      ['expired', sessionToken]
    );
    status = 'expired';
  }

  const phone = session.phone || null;
  const phoneVerified = !!phone;
  const telegramVerified = status === 'completed';

  return {
    status,
    phone,
    phoneVerified,
    telegramVerified,
  };
}

// =========================
// Registration handlers
// =========================

/**
 * Обработка начала регистрации
 */
async function handleRegistrationStart(ctx, sessionToken) {
  const chatId = ctx.chat?.id;
  const from = ctx.from;

  if (!chatId || !from) return;

  logger.info('Registration start attempt', {
    sessionToken,
    chatId,
    userId: from.id,
    username: from.username,
  });

  // Проверяем формат sessionToken (должен быть UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionToken)) {
    logger.error('Invalid sessionToken format', {
      sessionToken,
      length: sessionToken.length,
      chatId,
      userId: from.id,
    });
    await ctx.reply(
      'Неверная ссылка для регистрации.\nПожалуйста, отсканируйте QR код заново или нажмите на ссылку в браузере.'
    );
    return;
  }

  // Получаем сессию из БД
  const result = await db.query(
    `SELECT * FROM registration_sessions WHERE id = $1`,
    [sessionToken]
  );

  if (result.rows.length === 0) {
    logger.error('Session not found by token', {
      sessionToken,
      chatId,
      userId: from.id,
    });

    // Fallback: пробуем найти активную сессию по telegram_id
    const telegramId = String(from.id);
    const fallbackResult = await db.query(
      `SELECT * FROM registration_sessions
       WHERE telegram_id = $1 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [telegramId]
    );

    if (fallbackResult.rows.length > 0) {
      const fallbackSession = fallbackResult.rows[0];
      const now = new Date();
      const expires = new Date(fallbackSession.expires_at);

      if (now <= expires) {
        waitingForPhone.set(chatId, fallbackSession.id);
        const language = fallbackSession.language || 'ru';
        const messages = {
          ru: {
            prompt: 'Чтобы подтвердить телефон для WELLIFY business,\nотправьте ваш номер телефона или нажмите кнопку ниже',
            button: 'Отправить номер телефона'
          },
          uk: {
            prompt: 'Щоб підтвердити телефон для WELLIFY business,\nнадішліть ваш номер телефону або натисніть кнопку нижче',
            button: 'Надіслати номер телефону'
          },
          en: {
            prompt: 'To verify your phone for WELLIFY business,\nsend your phone number or press the button below',
            button: 'Send phone number'
          }
        };

        const msg = messages[language] || messages.ru;

        await ctx.reply(msg.prompt, {
          reply_markup: {
            keyboard: [
              [{ text: msg.button, request_contact: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
        return;
      }
    }

    await ctx.reply(
      'Ссылка для регистрации не найдена или больше не актуальна.\nПожалуйста, вернитесь в браузер и отсканируйте QR код заново.'
    );
    return;
  }

  const session = result.rows[0];

  logger.info('Session found', {
    sessionId: session.id,
    status: session.status,
    userId: session.user_id,
    email: session.email,
  });

  const now = new Date();
  const expires = new Date(session.expires_at);

  // Проверяем срок действия
  if (now > expires) {
    await db.query(
      'UPDATE registration_sessions SET status = $1 WHERE id = $2',
      ['expired', sessionToken]
    );

    await ctx.reply(
      'Срок действия ссылки истёк (30 минут).\nПожалуйста, вернитесь в браузер и отсканируйте QR код заново.'
    );
    return;
  }

  // Проверяем статус
  if (session.status !== 'pending') {
    if (session.status === 'completed') {
      await ctx.reply(
        'Эта сессия регистрации уже завершена.\nВернитесь в браузер для завершения регистрации.'
      );
    } else {
      await ctx.reply(
        'Ссылка для регистрации больше не актуальна.\nПожалуйста, вернитесь в браузер и отсканируйте QR код заново.'
      );
    }
    return;
  }

  // Сохраняем telegram_id в сессию
  await db.query(
    'UPDATE registration_sessions SET telegram_id = $1 WHERE id = $2',
    [String(from.id), sessionToken]
  );

  // Сохраняем sessionToken в контексте
  waitingForPhone.set(chatId, sessionToken);

  // Определяем язык сообщения
  const language = session.language || 'ru';
  const messages = {
    ru: {
      prompt: 'Чтобы подтвердить телефон для WELLIFY business,\nотправьте ваш номер телефона или нажмите кнопку ниже',
      button: 'Отправить номер телефона'
    },
    uk: {
      prompt: 'Щоб підтвердити телефон для WELLIFY business,\nнадішліть ваш номер телефону або натисніть кнопку нижче',
      button: 'Надіслати номер телефону'
    },
    en: {
      prompt: 'To verify your phone for WELLIFY business,\nsend your phone number or press the button below',
      button: 'Send phone number'
    }
  };

  const msg = messages[language] || messages.ru;

  await ctx.reply(msg.prompt, {
    reply_markup: {
      keyboard: [
        [{ text: msg.button, request_contact: true }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

/**
 * Валидация номера телефона
 */
function validatePhoneNumber(phone) {
  const cleaned = phone.replace(/[\s\-]/g, '');
  return /^\+?\d{10,15}$/.test(cleaned);
}

/**
 * Нормализация номера телефона
 */
function normalizePhoneNumber(phone) {
  const cleaned = phone.replace(/[\s\-]/g, '');
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Обработка номера телефона
 */
async function handleRegistrationPhone(ctx, phone, sessionToken) {
  const from = ctx.from;
  const chatId = ctx.chat?.id;

  if (!from || !chatId) return;

  const telegramId = String(from.id);

  // Получаем сессию
  const result = await db.query(
    `SELECT * FROM registration_sessions WHERE id = $1`,
    [sessionToken]
  );

  if (result.rows.length === 0) {
    await ctx.reply(
      'Не удалось найти активную сессию регистрации.\nВернитесь в браузер и начните регистрацию заново.'
    );
    waitingForPhone.delete(chatId);
    return;
  }

  const session = result.rows[0];

  // Проверяем статус
  if (session.status !== 'pending') {
    await ctx.reply(
      'Эта сессия регистрации уже завершена или истекла.\nВернитесь в браузер.'
    );
    waitingForPhone.delete(chatId);
    return;
  }

  // Проверяем срок действия
  const now = new Date();
  const expires = new Date(session.expires_at);
  if (now > expires) {
    await db.query(
      'UPDATE registration_sessions SET status = $1 WHERE id = $2',
      ['expired', sessionToken]
    );

    await ctx.reply(
      'Срок действия ссылки истёк.\nВернитесь в браузер и начните регистрацию заново.'
    );
    waitingForPhone.delete(chatId);
    return;
  }

  // Нормализуем номер телефона
  const normalizedPhone = normalizePhoneNumber(phone);

  // Проверяем, не используется ли номер другим пользователем
  const checkResult = await db.query(
    `SELECT id, phone FROM profiles
     WHERE phone = $1 AND id != $2`,
    [normalizedPhone, session.user_id]
  );

  if (checkResult.rows.length > 0) {
    const language = session.language || 'ru';
    const messages = {
      ru: {
        error: '❌ Этот номер телефона уже используется другим аккаунтом WELLIFY business.\nПожалуйста, используйте другой номер телефона или обратитесь в поддержку.',
        button: 'Отправить номер телефона'
      },
      uk: {
        error: '❌ Цей номер телефону вже використовується іншим акаунтом WELLIFY business.\nБудь ласка, використайте інший номер телефону або зверніться до підтримки.',
        button: 'Надіслати номер телефону'
      },
      en: {
        error: '❌ This phone number is already used by another WELLIFY business account.\nPlease use a different phone number or contact support.',
        button: 'Send phone number'
      }
    };

    const msg = messages[language] || messages.ru;

    await ctx.reply(msg.error, {
      reply_markup: {
        keyboard: [
          [{ text: msg.button, request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  // Обновляем сессию
  await db.query(
    `UPDATE registration_sessions
     SET status = 'completed',
         phone = $1,
         completed_at = NOW()
     WHERE id = $2`,
    [normalizedPhone, sessionToken]
  );

  // Обновляем профиль пользователя
  await db.query(
    `UPDATE profiles
     SET phone = $1,
         telegram_id = $2,
         telegram_username = $3,
         telegram_first_name = $4,
         telegram_last_name = $5,
         telegram_verified = true,
         phone_verified = true,
         updated_at = NOW()
     WHERE id = $6`,
    [
      normalizedPhone,
      telegramId,
      from.username || null,
      from.first_name || null,
      from.last_name || null,
      session.user_id
    ]
  );

  // Определяем язык сообщения
  const language = session.language || 'ru';
  const messages = {
    ru: {
      success: '✅ Номер телефона привязан к вашему аккаунту WELLIFY business.\nВы можете вернуться в браузер',
      welcome: 'Поздравляем. Вы официально в WELLIFY Business.\n\nС этого момента вы всегда можете быть на связи с нашей командой: задавать вопросы, получать помощь, делиться идеями, предлагать улучшения и влиять на развитие сервиса. Ваши идеи и предложения напрямую влияют на то, каким станет WELLIFY Business дальше.\n\nМы всегда на связи и открыты к диалогу - именно так и строится WELLIFY Business.'
    },
    uk: {
      success: '✅ Номер телефону прив\'язано до вашого акаунту WELLIFY business.\nВи можете повернутися в браузер',
      welcome: 'Вітаємо. Ви офіційно в WELLIFY Business.\n\nЗ цього моменту ви завжди можете бути на зв\'язку з нашою командою: задавати питання, отримувати допомогу, ділитися ідеями, пропонувати покращення та впливати на розвиток сервісу. Ваші ідеї та пропозиції безпосередньо впливають на те, яким стане WELLIFY Business далі.\n\nМи завжди на зв\'язку та відкриті до діалогу - саме так і будується WELLIFY Business.'
    },
    en: {
      success: '✅ Phone number linked to your WELLIFY business account.\nYou can return to the browser',
      welcome: 'Congratulations. You are officially in WELLIFY Business.\n\nFrom now on, you can always be in touch with our team: ask questions, get help, share ideas, suggest improvements, and influence the development of the service. Your ideas and suggestions directly influence what WELLIFY Business will become next.\n\nWe are always in touch and open to dialogue - this is how WELLIFY Business is built.'
    }
  };

  const msg = messages[language] || messages.ru;

  await ctx.reply(msg.success, {
    reply_markup: {
      remove_keyboard: true,
    },
  });

  // Отправляем приветственное сообщение через 1.5 секунды
  setTimeout(async () => {
    try {
      await ctx.reply(msg.welcome);
    } catch (error) {
      logger.error('Error sending welcome message:', error);
    }
  }, 1500);

  // Очищаем состояние
  waitingForPhone.delete(chatId);
}

/**
 * Обработка контакта
 */
async function handleRegistrationContact(ctx) {
  const from = ctx.from;
  const msg = ctx.message;
  const chatId = ctx.chat?.id;

  if (!from || !msg || !msg.contact || !chatId) return;

  const phone = msg.contact.phone_number;

  // Пытаемся найти sessionToken из контекста
  let sessionToken = waitingForPhone.get(chatId);

  // Если нет в контексте, ищем по telegram_id
  if (!sessionToken) {
    const telegramId = String(from.id);
    const result = await db.query(
      `SELECT id FROM registration_sessions
       WHERE telegram_id = $1 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [telegramId]
    );

    if (result.rows.length > 0) {
      sessionToken = result.rows[0].id;
    }
  }

  if (!sessionToken) {
    await ctx.reply(
      'Не удалось найти активную сессию регистрации.\nВернитесь в браузер и начните регистрацию заново.'
    );
    return;
  }

  await handleRegistrationPhone(ctx, phone, sessionToken);
}

// =========================
// Bot setup (если бот инициализирован)
// =========================

if (bot) {
  // /start – регистрация или поддержка
  bot.start(async (ctx) => {
    const msg = ctx.message;
    let sessionToken;

    logger.info('[bot.start] Received /start command', {
      chatId: ctx.chat?.id,
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });

    if (msg && 'text' in msg && typeof msg.text === 'string') {
      const fullText = msg.text.trim();
      const parts = fullText.split(/\s+/);

      if (parts.length > 1) {
        sessionToken = parts[1].trim();
      }
    }

    if (sessionToken) {
      await handleRegistrationStart(ctx, sessionToken);
      return;
    }

    const userId = ctx.from?.id;
    if (!userId) return;

    waitingForDescription.set(userId, true);

    await ctx.reply(
      'Привет! Это поддержка WELLIFY business.\n\n' +
        'Пожалуйста, опишите вашу проблему одним сообщением - мы зафиксируем обращение и свяжемся с вами.'
    );
  });

  // Поддержка: текстовые сообщения
  bot.on('text', async (ctx) => {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    if (!userId || !chatId) return;

    // Проверяем, ожидается ли номер телефона для регистрации
    const sessionToken = waitingForPhone.get(chatId);
    if (sessionToken) {
      const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

      if (!messageText) {
        return;
      }

      // Валидация номера телефона
      if (!validatePhoneNumber(messageText)) {
        const result = await db.query(
          `SELECT language FROM registration_sessions WHERE id = $1`,
          [sessionToken]
        );

        const language = result.rows[0]?.language || 'ru';
        const messages = {
          ru: 'Неверный формат номера телефона. Пожалуйста, отправьте номер в формате: +380501234567',
          uk: 'Невірний формат номера телефону. Будь ласка, надішліть номер у форматі: +380501234567',
          en: 'Invalid phone number format. Please send the number in format: +380501234567'
        };

        await ctx.reply(messages[language] || messages.ru);
        return;
      }

      // Обрабатываем номер телефона
      await handleRegistrationPhone(ctx, messageText, sessionToken);
      return;
    }

    // Проверяем, ожидается ли описание проблемы (поддержка)
    const isWaiting = waitingForDescription.get(userId);

    if (!isWaiting) {
      await ctx.reply(
        'Для создания нового обращения отправьте команду /start и следуйте инструкции.'
      );
      return;
    }

    const telegram_user_id = userId;
    const telegram_username = ctx.from.username || null;
    const telegram_full_name =
      [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || null;
    const message = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

    try {
      // Сохраняем обращение в БД (нужно создать таблицу support_tickets если её нет)
      // Пока просто логируем
      logger.info('Support ticket received', {
        telegram_user_id,
        telegram_username,
        telegram_full_name,
        message,
      });

      // TODO: Создать таблицу support_tickets в БД и сохранять туда
      // await db.query(
      //   `INSERT INTO support_tickets (telegram_user_id, telegram_username, telegram_full_name, message, status)
      //    VALUES ($1, $2, $3, $4, $5)`,
      //   [telegram_user_id, telegram_username, telegram_full_name, message, 'new']
      // );

      await ctx.reply(
        'Спасибо! Ваше обращение зафиксировано. Наш сотрудник свяжется с вами в ближайшее время.'
      );

      // Отправляем уведомление менеджерам
      if (SUPPORT_MANAGERS_CHAT_ID) {
        try {
          const chatId = parseInt(SUPPORT_MANAGERS_CHAT_ID, 10);
          await bot.telegram.sendMessage(
            chatId,
            `Новый запрос в поддержку WELLIFY business\n\n` +
              `Telegram ID: ${telegram_user_id}\n` +
              `Username: ${telegram_username || 'не указан'}\n` +
              `Имя: ${telegram_full_name || 'не указано'}\n\n` +
              `Сообщение:\n${message}`
          );
        } catch (e) {
          logger.error('Ошибка при отправке уведомления менеджеру:', e);
        }
      }
    } catch (e) {
      logger.error('Ошибка при сохранении обращения:', e);
      await ctx.reply(
        'Произошла внутренняя ошибка при сохранении обращения. Попробуйте позже.'
      );
      return;
    }

    waitingForDescription.delete(userId);
  });

  // Контакт – для регистрации
  bot.on('contact', async (ctx) => {
    await handleRegistrationContact(ctx);
  });

  // Медиа – просто подсказка
  bot.on(['photo', 'video', 'document', 'sticker', 'voice', 'audio'], async (ctx) => {
    await ctx.reply(
      'Пока я понимаю только текстовые сообщения. Пожалуйста, опишите проблему текстом.'
    );
  });

  // Обработка ошибок
  bot.catch((err, ctx) => {
    logger.error('Telegram bot error', { error: err, ctx });
  });
}

// Экспортируем функции и бота
export {
  bot,
  createRegistrationSession,
  getSessionStatus,
};
