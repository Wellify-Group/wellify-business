/**
 * SMS/Phone Verification Routes
 * Управление верификацией телефона
 */

import express from 'express';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/sms/send-code
 * Отправить код верификации на телефон
 */
router.post('/send-code', async (req, res) => {
  try {
    const { phone, action = 'signup' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // Проверяем существующую запись
    const existing = await db.query(
      'SELECT * FROM phone_verification_attempts WHERE phone = $1 AND action = $2',
      [phone, action]
    );

    if (existing.rows.length > 0) {
      const attempt = existing.rows[0];
      const attemptsCount = attempt.attempts_count || 0;
      
      // Лимит попыток (например, 5 в час)
      if (attemptsCount >= 5) {
        const lastSent = new Date(attempt.last_sent_at);
        const hoursSinceLastSent = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSent < 1) {
          return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
        }
      }
    }

    // Обновляем или создаём запись
    await db.query(
      `INSERT INTO phone_verification_attempts (phone, action, verification_code, code_expires_at, attempts_count, last_sent_at)
       VALUES ($1, $2, $3, $4, 0, NOW())
       ON CONFLICT (phone, action) DO UPDATE
       SET verification_code = $3,
           code_expires_at = $4,
           attempts_count = phone_verification_attempts.attempts_count + 1,
           last_sent_at = NOW()`,
      [phone, action, code, expiresAt]
    );

    // TODO: Отправить SMS через провайдера (Twilio)
    logger.info('Phone verification code generated', { phone, action, code: code.substring(0, 2) + '****' });

    // Временная заглушка - в production нужно подключить SMS API
    res.json({ 
      success: true, 
      message: 'Verification code sent',
      // В development можно вернуть код для тестирования
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    logger.error('Send phone verification code error', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * POST /api/sms/verify-code
 * Проверить код верификации телефона
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { phone, code, action = 'signup' } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and code are required' });
    }

    // Находим запись верификации
    const result = await db.query(
      `SELECT * FROM phone_verification_attempts
       WHERE phone = $1 AND action = $2
         AND verification_code = $3
         AND code_expires_at > NOW()`,
      [phone, action, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Код верный - можно обновить phone_verified в профиле пользователя
    // Но для этого нужен userId, который будет передан отдельно или найден по phone
    res.json({ success: true, message: 'Phone code verified successfully' });
  } catch (error) {
    logger.error('Verify phone code error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

