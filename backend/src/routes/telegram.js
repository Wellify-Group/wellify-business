/**
 * Telegram Routes
 * Управление верификацией Telegram при регистрации
 */

import express from 'express';
import { logger } from '../utils/logger.js';
import { createRegistrationSession, getSessionStatus } from '../services/telegram-bot.js';

const router = express.Router();

/**
 * POST /api/telegram/create-session
 * Создать сессию регистрации для связки с Telegram
 */
router.post('/create-session', async (req, res) => {
  try {
    const { userId, email, language = 'ru' } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'userId and email are required'
      });
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Email must be a valid email address'
      });
    }

    // Валидация userId (должен быть UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({
        error: 'Invalid userId format',
        details: 'userId must be a valid UUID'
      });
    }

    // Валидация language
    if (language && !['ru', 'uk', 'en'].includes(language)) {
      return res.status(400).json({
        error: 'Invalid language',
        details: 'language must be one of: ru, uk, en'
      });
    }

    logger.info('[create-session] Request received', {
      userId,
      email,
      language: language || 'ru',
    });

    const session = await createRegistrationSession({
      userId,
      email: email.toLowerCase(),
      language: language || 'ru',
    });

    // Формируем ссылку на Telegram бота
    const botUsername = (process.env.TELEGRAM_BOT_USERNAME || 'WellifyBusinessBot').replace('@', '');
    const telegramLink = `https://t.me/${botUsername}?start=${session.id}`;

    logger.info('[create-session] Session created and link generated', {
      sessionToken: session.id,
      telegramLink,
      botUsername,
      sessionStatus: session.status,
      expiresAt: session.expires_at,
    });

    // Определяем язык для инструкции
    const instructionLanguage = session.language || language || 'ru';
    const qrInstructions = {
      ru: 'Отсканируйте QR код камерой телефона или нажмите на ссылку ниже. Вас переведет в Telegram для завершения регистрации.',
      uk: 'Відскануйте QR код камерою телефону або натисніть на посилання нижче. Вас переведе в Telegram для завершення реєстрації.',
      en: 'Scan the QR code with your phone camera or click the link below. You will be redirected to Telegram to complete registration.'
    };

    const response = {
      sessionToken: session.id,
      telegramLink,
      qrInstruction: qrInstructions[instructionLanguage] || qrInstructions.ru,
    };

    return res.json(response);
  } catch (e) {
    logger.error('[create-session] Error creating session', {
      error: e.message,
      stack: e.stack,
      requestBody: req.body,
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      details: e.message || 'Failed to create session'
    });
  }
});

/**
 * GET /api/telegram/session-status/:sessionToken
 * Проверить статус сессии регистрации
 */
router.get('/session-status/:sessionToken', async (req, res) => {
  try {
    const { sessionToken } = req.params;

    // Валидация sessionToken (должен быть UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionToken)) {
      return res.status(400).json({
        error: 'Invalid sessionToken format',
        details: 'sessionToken must be a valid UUID'
      });
    }

    const data = await getSessionStatus(sessionToken);
    
    // Если сессия не найдена, возвращаем 404
    if (data.status === 'expired' && !data.phone) {
      return res.status(404).json({
        error: 'Session not found',
        details: 'Session does not exist or has expired'
      });
    }

    return res.json(data);
  } catch (e) {
    logger.error('session-status error', e);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: e.message || 'Failed to get session status'
    });
  }
});

export default router;