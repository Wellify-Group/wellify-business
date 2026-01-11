/**
 * Telegram Routes
 * Управление верификацией Telegram при регистрации
 */

import express from 'express';
import crypto from 'crypto';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/telegram/create-session
 * Создать сессию регистрации для связки с Telegram
 */
router.post('/create-session', async (req, res) => {
  try {
    const { userId, email, language = 'ru' } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    // Генерируем токен сессии (UUID)
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // Создаем сессию регистрации
    await db.query(
      `INSERT INTO registration_sessions (id, user_id, email, language, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionToken, userId, email.toLowerCase(), language, 'pending', expiresAt]
    );

    // Формируем ссылку на Telegram бота
    // TELEGRAM_BOT_USERNAME должен быть установлен в переменных окружения
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'WellifyBusinessBot';
    const telegramLink = `https://t.me/${botUsername}?start=${sessionToken}`;

    logger.info('Registration session created', {
      userId,
      email,
      sessionToken: sessionToken.substring(0, 8) + '...',
      expiresAt
    });

    res.json({
      success: true,
      sessionToken,
      telegramLink
    });
  } catch (error) {
    logger.error('Create telegram session error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/telegram/session-status/:sessionToken
 * Проверить статус сессии регистрации
 */
router.get('/session-status/:sessionToken', async (req, res) => {
  try {
    const { sessionToken } = req.params;

    const result = await db.query(
      `SELECT id, user_id, email, language, status, created_at, expires_at, completed_at, telegram_id, phone
       FROM registration_sessions
       WHERE id = $1`,
      [sessionToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];

    // Проверяем, истекла ли сессия
    if (new Date(session.expires_at) < new Date() && session.status === 'pending') {
      await db.query(
        'UPDATE registration_sessions SET status = $1 WHERE id = $2',
        ['expired', sessionToken]
      );
      session.status = 'expired';
    }

    res.json({
      success: true,
      status: session.status,
      completed: session.status === 'completed',
      expired: session.status === 'expired',
      telegramId: session.telegram_id,
      phone: session.phone
    });
  } catch (error) {
    logger.error('Get telegram session status error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/telegram/complete-session
 * Завершить сессию регистрации (вызывается ботом)
 * Обновляет профиль пользователя с данными Telegram
 */
router.post('/complete-session', async (req, res) => {
  try {
    const { sessionToken, telegramId, telegramUsername, telegramFirstName, telegramLastName, phone } = req.body;

    if (!sessionToken || !telegramId) {
      return res.status(400).json({ error: 'sessionToken and telegramId are required' });
    }

    // Находим сессию
    const sessionResult = await db.query(
      `SELECT * FROM registration_sessions
       WHERE id = $1 AND status = 'pending' AND expires_at > NOW()`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const session = sessionResult.rows[0];

    // Обновляем профиль пользователя
    await db.query(
      `UPDATE profiles 
       SET telegram_id = $1,
           telegram_username = $2,
           telegram_first_name = $3,
           telegram_last_name = $4,
           telegram_verified = true,
           phone = COALESCE($5, phone),
           phone_verified = CASE WHEN $5 IS NOT NULL THEN true ELSE phone_verified END,
           updated_at = NOW()
       WHERE id = $6`,
      [telegramId, telegramUsername || null, telegramFirstName || null, telegramLastName || null, phone || null, session.user_id]
    );

    // Помечаем сессию как завершенную
    await db.query(
      `UPDATE registration_sessions 
       SET status = 'completed',
           completed_at = NOW(),
           telegram_id = $1,
           phone = $2
       WHERE id = $3`,
      [telegramId, phone || null, sessionToken]
    );

    logger.info('Registration session completed', {
      userId: session.user_id,
      telegramId,
      sessionToken: sessionToken.substring(0, 8) + '...'
    });

    res.json({
      success: true,
      message: 'Session completed successfully'
    });
  } catch (error) {
    logger.error('Complete telegram session error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;